@echo off
REM Create 10 sample FAQs

echo Creating FAQ 1 - Password Reset...
curl -X POST http://localhost:3000/api/faq -H "Content-Type: application/json" -d "{\"question\":\"How do I reset my password?\",\"answer\":\"Click the Forgot Password link on the login page. Check your email for reset instructions within 10 minutes.\"}"

echo Creating FAQ 2 - Business Hours...
curl -X POST http://localhost:3000/api/faq -H "Content-Type: application/json" -d "{\"question\":\"What are your business hours?\",\"answer\":\"We are open Monday through Friday, 9 AM to 6 PM EST. Weekend support is available for premium members.\"}"

echo Creating FAQ 3 - Cancel Subscription...
curl -X POST http://localhost:3000/api/faq -H "Content-Type: application/json" -d "{\"question\":\"How do I cancel my subscription?\",\"answer\":\"Go to Settings > Billing > Cancel Subscription. You can cancel anytime, no partial month charges.\"}"

echo Creating FAQ 4 - Refunds...
curl -X POST http://localhost:3000/api/faq -H "Content-Type: application/json" -d "{\"question\":\"Do you offer refunds?\",\"answer\":\"Yes, we offer a 30-day money-back guarantee. Contact support if you are not satisfied.\"}"

echo Creating FAQ 5 - Update Profile...
curl -X POST http://localhost:3000/api/faq -H "Content-Type: application/json" -d "{\"question\":\"How do I update my profile?\",\"answer\":\"Click your avatar in the top right corner, select Settings, and update your information. Changes save automatically.\"}"

echo Creating FAQ 6 - Login Issues...
curl -X POST http://localhost:3000/api/faq -H "Content-Type: application/json" -d "{\"question\":\"I can't log in to my account\",\"answer\":\"Try resetting your password. Make sure caps lock is off. If problems persist, contact our support team.\"}"

echo Creating FAQ 7 - Pricing...
curl -X POST http://localhost:3000/api/faq -H "Content-Type: application/json" -d "{\"question\":\"What are your pricing plans?\",\"answer\":\"We offer three plans: Basic at $9/month, Pro at $29/month, and Enterprise at custom pricing. All plans include a 14-day free trial.\"}"

echo Creating FAQ 8 - Payment Methods...
curl -X POST http://localhost:3000/api/faq -H "Content-Type: application/json" -d "{\"question\":\"What payment methods do you accept?\",\"answer\":\"We accept all major credit cards, PayPal, and bank transfers for annual subscriptions.\"}"

echo Creating FAQ 9 - Data Security...
curl -X POST http://localhost:3000/api/faq -H "Content-Type: application/json" -d "{\"question\":\"Is my data secure?\",\"answer\":\"Yes, we use 256-bit SSL encryption and comply with GDPR and SOC 2 standards. Your data is regularly backed up.\"}"

echo Creating FAQ 10 - Export Data...
curl -X POST http://localhost:3000/api/faq -H "Content-Type: application/json" -d "{\"question\":\"Can I export my data?\",\"answer\":\"Yes, you can export your data as CSV or JSON from Settings > Data > Export. The export is instant and emailed to you.\"}"

echo All FAQs created!
