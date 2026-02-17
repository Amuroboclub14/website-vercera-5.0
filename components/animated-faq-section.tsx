'use client'

import { motion } from 'framer-motion'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const faqs = [
  {
    question: 'When is Vercera 5.0 happening?',
    answer:
      'Vercera 5.0 is scheduled for March 14-16, 2026. Different events will be held across these days. Check the event details for specific timings.',
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
      'Refunds are accepted up to 7 days before the event. If you cancel within 7 days of the event, no refund will be issued. Event transfers to other participants are allowed.',
  },
  {
    question: 'Do I need to bring anything?',
    answer:
      'For technical events like hackathons, you need to bring your laptop. For gaming tournaments, we provide gaming setups. Check individual event details for specific requirements.',
  },
  {
    question: 'Is accommodation provided?',
    answer:
      'Accommodation is not provided by the organizers. However, we can help with recommendations for nearby hostels and hotels. Participants from out of station can request information at the registration desk.',
  },
  {
    question: 'Can teams have members from different colleges?',
    answer:
      'Yes! Most events allow cross-college teams. Individual event rules specify team composition requirements. Check the rules section before registering.',
  },
  {
    question: 'What if I face issues during registration?',
    answer:
      'Contact our support team at support@vercera.com or call the helpline number provided on the website. We\'re available 24/7 during the fest.',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
}

export function FAQSection() {
  return (
    <section id="faq" className="py-20 bg-secondary/20 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Frequently Asked
            <span className="block text-accent">Questions</span>
          </h2>
          <p className="text-foreground/70 text-lg">Find answers to common questions about Vercera 5.0</p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Accordion type="single" collapsible className="w-full space-y-3">
            {faqs.map((faq, index) => (
              <motion.div key={index} variants={itemVariants}>
                <AccordionItem
                  value={`item-${index}`}
                  className="border border-border/50 rounded-lg bg-card/50 overflow-hidden data-[state=open]:bg-card data-[state=open]:border-accent/50 transition-all"
                >
                  <AccordionTrigger className="text-foreground hover:text-accent transition-colors data-[state=open]:text-accent py-4 px-4 font-semibold hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-foreground/70 pb-4 px-4 border-t border-border/30">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  )
}
