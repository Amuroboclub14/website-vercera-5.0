'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const faqs = [
  {
    question: 'When is Vercera 5.0 happening?',
    answer:
      'Vercera 5.0 is scheduled for April 17-21, 2026. Different events will be held across these days. Check the event details for specific timings.',
  },
  {
    question: 'Can I participate in multiple events?',
    answer:
      'Yes! You can register for multiple events. However, ensure that the event timings do not overlap. Each event requires separate registration and payment.',
  },
  {
    question: 'What payment methods are accepted?',
    answer:
      'We accept all major payment methods through Razorpay including credit/debit cards, net banking, UPI, and digital wallets. You must be logged in to register and pay.',
  },
  {
    question: 'Is there a refund policy?',
    answer:
      'Refunds are not accepted under any circumstances.',
  },
  {
    question: 'Do I need to bring anything?',
    answer:
      'For technical events like hackathons, you need to bring your laptop. For gaming tournaments, we provide gaming setups. Check individual event details for specific requirements.',
  },
  {
    question: 'Is accommodation provided?',
    answer:
      'Accommodation is provided in accomodation bundle. You can buy it from the registration page. Participants from out of station can request information at the registration desk.',
  },
  {
    question: 'Can teams have members from different colleges?',
    answer:
      'Yes! Most events allow cross-college teams. Individual event rules specify team composition requirements. Check the rules section before registering.',
  },
  {
    question: 'What if I face issues during registration?',
    answer:
      'Contact our support team at chairperson@amuroboclub.com or call the numbers provided on the website. We\'re available 24/7 during the fest.',
  },
]

export function FAQSection() {
  return (
    <section id="faq" className="py-20 bg-secondary/20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Frequently Asked
            <span className="block text-accent">Questions</span>
          </h2>
          <p className="text-foreground/70 text-lg">Find answers to common questions about Vercera 5.0</p>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border/50 rounded-lg bg-card/50 overflow-hidden data-[state=open]:bg-card data-[state=open]:border-accent/50 transition-all"
            >
              <AccordionTrigger className="text-foreground hover:text-accent transition-colors data-[state=open]:text-accent py-4 px-4 font-semibold hover:no-underline">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-foreground/70 pb-4 px-4 border-t border-border/30">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
