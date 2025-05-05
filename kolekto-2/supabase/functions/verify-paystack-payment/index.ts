
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const reqData = await req.json();
    const { reference } = reqData;

    console.log("Processing payment verification for reference:", reference);

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Missing payment reference" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Paystack secret key
    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      return new Response(
        JSON.stringify({ error: "Payment service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Verifying transaction with Paystack API");
    
    // Verify the transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error("Paystack verification error:", data);
      return new Response(
        JSON.stringify({ error: data.message || "Payment verification failed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the transaction details
    const transaction = data.data;
    
    console.log("Paystack verification successful:", {
      status: transaction.status,
      amount: transaction.amount,
      reference: transaction.reference
    });
    
    // If the payment is successful, update the database
    if (transaction.status === "success") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const collectionId = transaction.metadata?.collectionId;
      const participants = transaction.metadata?.participants || [];
      const collectionTitle = transaction.metadata?.collectionTitle || "Untitled Collection";
      
      console.log("Payment metadata:", {
        collectionId,
        collectionTitle,
        participantsCount: participants.length
      });
      
      if (collectionId && participants.length > 0) {
        // First get the collection details to know the total amount
        const { data: collection, error: collectionError } = await supabase
          .from('collections')
          .select('*')
          .eq('id', collectionId)
          .single();
          
        if (collectionError) {
          console.error("Error fetching collection:", collectionError);
          return new Response(
            JSON.stringify({ error: "Error fetching collection details" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        console.log("Retrieved collection details:", {
          title: collection.title,
          amount: collection.amount,
          organizer_id: collection.organizer_id
        });
          
        // Calculate total amount and fees
        const totalAmount = transaction.amount / 100; // Convert from kobo to naira
        const amountPerPerson = collection.amount; // Amount per participant
        
        console.log("Processing contribution records for participants:", participants.length);
        
        let totalContributionAmount = 0;
        let contributionIds = [];
        
        // Create a contribution record for each participant
        for (const participant of participants) {
          try {
            // Generate a unique code for this contribution
            const uniqueCode = `${collection.id.slice(0, 6)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            
            console.log("Processing participant with data:", JSON.stringify(participant.data));
            
            // Extract only the requested fields from the participant data
            // This ensures we're only storing what was requested by the collection creator
            const contributorData = {
              collection_id: collectionId,
              contributor_name: participant.data?.['Full Name'] || participant.data?.['Name'] || transaction.customer.email.split('@')[0] || 'Anonymous',
              contributor_email: participant.data?.['Email'] || transaction.customer.email,
              contributor_phone: participant.data?.['Phone Number'] || participant.data?.['Phone'] || null,
              contributor_id: transaction.customer.id || 'anonymous', 
              amount: amountPerPerson,
              status: 'paid',
              payment_method: 'paystack',
              payment_reference: transaction.reference,
              receipt_details: {
                transaction_id: transaction.id,
                reference: transaction.reference,
                paid_at: transaction.paid_at,
                payment_channel: transaction.channel,
                collection_title: collection.title || null,
                unique_code: uniqueCode
              },
              // Store only the requested fields from the form
              contact_info: Object.keys(participant.data || {}).reduce((acc: any, key: string) => {
                // Don't store standard contact fields in the contact_info JSON as they're already in dedicated columns
                if (!['Full Name', 'Name', 'Email', 'Phone Number', 'Phone'].includes(key)) {
                  acc[key] = participant.data[key];
                }
                return acc;
              }, {})
            };

            console.log("Inserting contribution record:", {
              name: contributorData.contributor_name,
              email: contributorData.contributor_email,
              amount: contributorData.amount,
              uniqueCode,
              contact_info: contributorData.contact_info
            });

            const { data: contribution, error: contribError } = await supabase
              .from('contributions')
              .insert(contributorData)
              .select('id')
              .single();
              
            if (contribError) {
              console.error("Error recording contribution:", contribError);
              // Continue with the next participant instead of failing completely
              continue;
            }
            
            console.log("Successfully inserted contribution with ID:", contribution?.id);
            if (contribution?.id) {
              contributionIds.push(contribution.id);
            }
            totalContributionAmount += amountPerPerson;
            
            // Always record a transaction in the transactions table
            if (contribution && contribution.id) {
              // Calculate platform charges based on the tier system
              const platformChargePercent = calculatePlatformChargePercentage(amountPerPerson);
              const platformCharge = amountPerPerson * platformChargePercent;
              const gatewayFee = Math.min(amountPerPerson * 0.015, 2000); // 1.5% with cap at ₦2,000
              
              console.log("Recording transaction with fees:", {
                platformChargePercent,
                platformCharge,
                gatewayFee,
                contributionId: contribution.id
              });
              
              const { data: trans, error: transError } = await supabase
                .from('transactions')
                .insert({
                  collection_id: collectionId,
                  contribution_id: contribution.id,
                  user_id: collection.organizer_id, // The organizer of the collection
                  type: 'contribution',
                  status: 'successful',
                  amount: amountPerPerson,
                  description: `Payment for ${collection.title || 'collection'}`
                })
                .select('id');
                
              if (transError) {
                console.error("Error recording transaction:", transError);
              } else {
                console.log("Transaction record created successfully with ID:", trans?.id);
              }
            }
          } catch (err) {
            console.error("Error processing participant contribution:", err);
          }
        }
        
        // Update the collection's total amount raised
        try {
          // Calculate the total contributed amount from this transaction
          const currentTotal = collection.total_amount || 0;
          const newTotal = currentTotal + totalContributionAmount;
          
          console.log("Updating collection total amount:", {
            currentTotal,
            contributedAmount: totalContributionAmount,
            newTotal
          });
          
          const { data: updateResult, error: updateError } = await supabase
            .from('collections')
            .update({ 
              total_amount: newTotal,
              updated_at: new Date().toISOString()
            })
            .eq('id', collectionId)
            .select();
            
          if (updateError) {
            console.error("Error updating collection total amount:", updateError);
          } else {
            console.log("Collection total amount updated successfully to:", newTotal, "Result:", updateResult);
          }
        } catch (err) {
          console.error("Error updating collection:", err);
        }
      } else {
        console.warn("Missing collection ID or participants in payment metadata");
      }
    }

    return new Response(
      JSON.stringify({
        status: transaction.status,
        reference: transaction.reference,
        amount: transaction.amount / 100, // Convert from kobo to naira
        paidAt: transaction.paid_at
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Server error:", error.message);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Helper function to calculate platform charge percentage based on amount
function calculatePlatformChargePercentage(amount: number): number {
  if (amount < 1000) {
    return 0.03; // 3%
  } else if (amount < 5000) {
    return 0.025; // 2.5%
  } else if (amount < 20000) {
    return 0.02; // 2%
  } else {
    return 0.015; // 1.5%
  }
}
