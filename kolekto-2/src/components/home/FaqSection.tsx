
import React from 'react';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger 
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'What is Kolekto?',
    answer: 'Kolekto is a smart group payment platform that helps organizers collect payments from multiple people easily. Whether you\'re a class rep collecting for handouts or a friend organizing group transport, Kolekto simplifies the process.'
  },
  {
    question: 'Do I need to create an account to pay?',
    answer: 'No! Contributors don\'t need to create an account. You can simply use the payment link or scan a QR code to make your payment—fast, secure, and stress-free.'
  },
  {
    question: 'Can I pay for more than one person?',
    answer: 'Yes. Kolekto allows you to pay for multiple people in one transaction. You\'ll be asked to fill in each person\'s details like name, matric number, or location depending on the organizer\'s requirements.'
  },
  {
    question: 'What payment methods are supported?',
    answer: 'We support multiple secure options including Opay, Flutterwave, card payments, and bank transfers. More mobile wallets and local options will be added soon.'
  },
  {
    question: 'How do I know my payment was successful?',
    answer: 'Once your payment is completed, you\'ll receive a confirmation message or email (if provided). The organizer also gets your details in real-time.'
  },
  {
    question: 'How much does Kolekto charge?',
    answer: 'We only take a small service fee per transaction to maintain the platform. There are no hidden charges.'
  },
  {
    question: 'Is Kolekto only for students?',
    answer: 'No. While students are a major use case, anyone can use Kolekto—church groups, office teams, event organizers, and more.'
  },
  {
    question: 'Is my information safe?',
    answer: 'Absolutely. We prioritize security and privacy, following best practices to keep your data and payments secure at all times.'
  }
];

const FaqSection: React.FC = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                <AccordionTrigger className="py-4 text-left font-medium">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="py-3 text-gray-600">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
