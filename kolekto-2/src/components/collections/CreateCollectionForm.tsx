import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Key } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { useCollectionStore } from '@/store/useCollectionStore';

interface FormField {
  id: string;
  name: string;
  type: string;
  required: boolean;
}

const CreateCollectionForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [isMaxParticipantsEnabled, setIsMaxParticipantsEnabled] = useState(false);
  const [generateUniqueCodes, setGenerateUniqueCodes] = useState(false);
  const [codePrefix, setCodePrefix] = useState('');
  const [formFields, setFormFields] = useState<FormField[]>([
    { id: '1', name: 'Full Name', type: 'text', required: true },
    { id: '2', name: 'Email', type: 'email', required: true },
    { id: '3', name: 'Phone Number', type: 'tel', required: false },
  ]);

  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const { isCreating, createCollection } = useCollectionStore();

  const [feeBearer, setFeeBearer] = useState<'organizer' | 'contributor'>('organizer');
  const [kolektoFee, setKolektoFee] = useState(0);
  const [paymentGatewayFee, setPaymentGatewayFee] = useState(0);
  const [totalFees, setTotalFees] = useState(0);
  const [totalPayable, setTotalPayable] = useState(0);

  useEffect(() => {
    if (amount) {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount)) {
        let kolektoFeePercentage;
        if (parsedAmount < 1000) {
          kolektoFeePercentage = 0.03;
        } else if (parsedAmount < 5000) {
          kolektoFeePercentage = 0.025;
        } else if (parsedAmount < 20000) {
          kolektoFeePercentage = 0.02;
        } else {
          kolektoFeePercentage = 0.015;
        }
        
        let gatewayFee = parsedAmount * 0.015;
        gatewayFee = Math.min(gatewayFee, 2000);
        
        const platformFee = parsedAmount * kolektoFeePercentage;
        
        setKolektoFee(platformFee);
        setPaymentGatewayFee(gatewayFee);
        setTotalFees(platformFee + gatewayFee);
        
        if (feeBearer === 'contributor') {
          setTotalPayable(parsedAmount + platformFee + gatewayFee);
        } else {
          setTotalPayable(parsedAmount);
        }
      }
    } else {
      setKolektoFee(0);
      setPaymentGatewayFee(0);
      setTotalFees(0);
      setTotalPayable(0);
    }
  }, [amount, feeBearer]);

  const handleAddField = () => {
    const newId = (formFields.length + 1).toString();
    setFormFields([
      ...formFields, 
      { id: newId, name: '', type: 'text', required: false }
    ]);
  };

  const handleRemoveField = (id: string) => {
    setFormFields(formFields.filter(field => field.id !== id));
  };

  const handleFieldChange = (id: string, key: keyof FormField, value: string | boolean) => {
    setFormFields(formFields.map(field => 
      field.id === id ? { ...field, [key]: value } : field
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authUser) {
      toast.error("You must be logged in to create a collection.");
      navigate('/login');
      return;
    }

    const deadlineDate = deadline ? new Date(deadline).toISOString() : null;
    const maxParticipantsValue = isMaxParticipantsEnabled ? parseInt(maxParticipants) : null;

    const payload = {
      collectionTittle: title,
      collectionDescription: description || null,
      amount: parseFloat(amount),
      amountBreakdown: {
        baseAmount: amount ? parseFloat(amount) : 0,
        kolektoFee,
        paymentGatewayFee,
        totalFees,
        totalPayable,
        feeBearer,
      },
      deadline: deadlineDate,
      numberOfParticipants: maxParticipantsValue,
      participantInformation: formFields.map(field => ({
        name: field.name,
        type: field.type,
        required: field.required,
        value: null,
      })),
      generateUniqueCodes,
      codePrefix: generateUniqueCodes ? codePrefix : null,
    };

    await createCollection(payload, navigate);
  };

  const getKolektoFeePercentage = () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount === 0) return "3.0%";
    
    if (parsedAmount < 1000) return "3.0%";
    if (parsedAmount < 5000) return "2.5%";
    if (parsedAmount < 20000) return "2.0%";
    return "1.5%";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto px-4 sm:px-0">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Collection Title</Label>
          <Input
            id="title"
            placeholder="e.g. BIO 301 Handout"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Describe what this collection is for"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="amount">Amount per Person (NGN)</Label>
          <Input
            id="amount"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="e.g. 2000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full"
          />
        </div>
        
        {amount && parseFloat(amount) > 0 && (
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <div className="space-y-4">
                <h3 className="font-medium">Charges Breakdown</h3>
                
                <RadioGroup 
                  value={feeBearer} 
                  onValueChange={(value) => setFeeBearer(value as 'organizer' | 'contributor')}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="organizer" id="organizer" />
                    <Label htmlFor="organizer">Organizer pays charges (deducted from collection)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="contributor" id="contributor" />
                    <Label htmlFor="contributor">Contributor pays charges (added to payment amount)</Label>
                  </div>
                </RadioGroup>
                
                <div className="text-sm mb-2">
                  <p className="font-medium">Fee Structure:</p>
                  <ul className="list-disc pl-5 text-gray-600 space-y-1">
                    <li>₦0 – ₦999: 3.0% fee</li>
                    <li>₦1,000 – ₦4,999: 2.5% fee</li>
                    <li>₦5,000 – ₦19,999: 2.0% fee</li>
                    <li>₦20,000 and above: 1.5% fee</li>
                    <li>Gateway fee: 1.5% (capped at ₦2,000)</li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm border-t border-gray-200 pt-3">
                  <div>Base Amount:</div>
                  <div className="text-right font-medium">₦{parseFloat(amount).toLocaleString()}</div>
                  
                  <div>Kolekto Fee ({getKolektoFeePercentage()}):</div>
                  <div className="text-right">₦{kolektoFee.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                  
                  <div>Payment Gateway (1.5%):</div>
                  <div className="text-right">₦{paymentGatewayFee.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                  
                  <div className="border-t border-gray-200 pt-1 font-medium">Total Fees:</div>
                  <div className="border-t border-gray-200 pt-1 text-right font-medium">₦{totalFees.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                  
                  {feeBearer === 'contributor' && (
                    <>
                      <div className="pt-3 font-bold">Amount Payable:</div>
                      <div className="pt-3 text-right font-bold">₦{totalPayable.toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            type="date"
            required
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="maxParticipantsToggle"
              checked={isMaxParticipantsEnabled}
              onCheckedChange={setIsMaxParticipantsEnabled}
            />
            <Label htmlFor="maxParticipantsToggle">Limit number of participants</Label>
          </div>
          
          {isMaxParticipantsEnabled && (
            <div className="w-full sm:w-32">
              <Input
                id="maxParticipants"
                type="number"
                min="1"
                required={isMaxParticipantsEnabled}
                placeholder="e.g. 50"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full"
              />
            </div>
          )}
        </div>
        
        <div className="border-t pt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="uniqueCodesToggle"
                checked={generateUniqueCodes}
                onCheckedChange={setGenerateUniqueCodes}
              />
              <Label htmlFor="uniqueCodesToggle" className="flex items-center">
                <span>Generate unique codes for each participant</span>
                <Key className="ml-1 h-4 w-4 text-gray-500" />
              </Label>
            </div>
          </div>
          
          {generateUniqueCodes && (
            <div className="mt-4 space-y-2">
              <Label htmlFor="codePrefix">Code Prefix (Optional)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="codePrefix"
                  placeholder="e.g. BIO301-"
                  value={codePrefix}
                  onChange={(e) => setCodePrefix(e.target.value)}
                  className="w-full"
                />
                <div className="bg-gray-100 px-3 py-2 rounded-md text-sm font-mono">
                  {codePrefix || 'PREFIX-'}XYZ123
                </div>
              </div>
              <p className="text-sm text-gray-500">
                Unique codes will be generated for each person who pays. If someone pays for multiple people, each person will get their own code.
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="border-t pt-6">
        <h3 className="font-medium text-lg mb-4">Participant Information Fields</h3>
        <div className="space-y-4">
          {formFields.map((field) => (
            <div key={field.id} className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-3 sm:space-y-0">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <Input
                    placeholder="Field name"
                    value={field.name}
                    onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                    required
                    className="w-full"
                  />
                </div>
                <div className="col-span-1">
                  <Select
                    value={field.type}
                    onValueChange={(value) => handleFieldChange(field.id, 'type', value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="tel">Phone</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1 flex items-center space-x-2">
                  <Switch
                    id={`required-${field.id}`}
                    checked={field.required}
                    onCheckedChange={(checked) => handleFieldChange(field.id, 'required', checked)}
                  />
                  <Label htmlFor={`required-${field.id}`} className="text-sm">Required</Label>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveField(field.id)}
                disabled={formFields.length <= 1}
                className="self-start sm:self-center"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            className="w-full mt-2"
            onClick={handleAddField}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Field
          </Button>
        </div>
      </div>
      
      <div className="border-t pt-6">
        <Button 
          type="submit" 
          className="w-full bg-kolekto hover:bg-kolekto/90"
          disabled={isCreating}
        >
          {isCreating ? "Creating Collection..." : "Create Collection"}
        </Button>
      </div>
    </form>
  );
};

export default CreateCollectionForm;