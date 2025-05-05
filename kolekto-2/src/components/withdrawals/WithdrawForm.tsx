
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Banknote } from "lucide-react";

interface WithdrawFormProps {
  availableBalance: number;
  onSubmit: (data: {
    amount: number;
    accountName: string;
    accountNumber: string;
    bankName: string;
  }) => void;
  isLoading: boolean;
}

const BANKS = [
  "Access Bank",
  "Citibank",
  "Ecobank Nigeria",
  "Fidelity Bank",
  "First Bank of Nigeria",
  "First City Monument Bank",
  "Guaranty Trust Bank",
  "Heritage Bank",
  "Keystone Bank",
  "Polaris Bank",
  "Stanbic IBTC Bank",
  "Standard Chartered Bank",
  "Sterling Bank",
  "Union Bank of Nigeria",
  "United Bank for Africa",
  "Unity Bank",
  "Wema Bank",
  "Zenith Bank"
];

const WithdrawForm: React.FC<WithdrawFormProps> = ({ 
  availableBalance, 
  onSubmit, 
  isLoading 
}) => {
  const [amount, setAmount] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  
  const [errors, setErrors] = useState<{
    amount?: string;
    accountName?: string;
    accountNumber?: string;
    bankName?: string;
  }>({});
  
  const validate = () => {
    const newErrors: {
      amount?: string;
      accountName?: string;
      accountNumber?: string;
      bankName?: string;
    } = {};
    
    // Amount validation
    const parsedAmount = parseFloat(amount);
    if (!amount || isNaN(parsedAmount)) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (parsedAmount <= 0) {
      newErrors.amount = 'Amount must be greater than zero';
    } else if (parsedAmount > availableBalance) {
      newErrors.amount = 'Amount exceeds available balance';
    }
    
    // Account name validation
    if (!accountName.trim()) {
      newErrors.accountName = 'Account name is required';
    } else if (accountName.trim().length < 3) {
      newErrors.accountName = 'Please enter a valid account name';
    }
    
    // Account number validation
    const accountNumberRegex = /^\d{10}$/;
    if (!accountNumber) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!accountNumberRegex.test(accountNumber)) {
      newErrors.accountNumber = 'Account number must be 10 digits';
    }
    
    // Bank name validation
    if (!bankName) {
      newErrors.bankName = 'Please select a bank';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit({
        amount: parseFloat(amount),
        accountName,
        accountNumber,
        bankName
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount to Withdraw (₦)</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          className={errors.amount ? "border-red-500" : ""}
        />
        {errors.amount && (
          <p className="text-sm text-red-500">{errors.amount}</p>
        )}
        <p className="text-sm text-gray-500">Available balance: ₦{availableBalance.toLocaleString()}</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="accountName">Account Name</Label>
        <Input
          id="accountName"
          value={accountName}
          onChange={(e) => setAccountName(e.target.value)}
          placeholder="Enter account name"
          className={errors.accountName ? "border-red-500" : ""}
        />
        {errors.accountName && (
          <p className="text-sm text-red-500">{errors.accountName}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="accountNumber">Account Number</Label>
        <Input
          id="accountNumber"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          placeholder="Enter 10-digit account number"
          className={errors.accountNumber ? "border-red-500" : ""}
          maxLength={10}
        />
        {errors.accountNumber && (
          <p className="text-sm text-red-500">{errors.accountNumber}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="bankName">Bank</Label>
        <Select 
          value={bankName} 
          onValueChange={setBankName}
        >
          <SelectTrigger id="bankName" className={errors.bankName ? "border-red-500" : ""}>
            <SelectValue placeholder="Select bank" />
          </SelectTrigger>
          <SelectContent>
            {BANKS.map((bank) => (
              <SelectItem key={bank} value={bank}>
                {bank}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.bankName && (
          <p className="text-sm text-red-500">{errors.bankName}</p>
        )}
      </div>
      
      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full bg-kolekto hover:bg-kolekto/90"
          disabled={isLoading}
        >
          {isLoading ? (
            <>Processing Withdrawal...</>
          ) : (
            <>
              <Banknote className="mr-2 h-4 w-4" />
              Withdraw Funds
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default WithdrawForm;
