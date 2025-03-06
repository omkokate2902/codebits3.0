import base64
import os
# from google import genai
# from google.genai import types
import google.generativeai as genai


def chatbot_controller():
    client = genai.Client(
        api_key=os.environ.get("GEMINI_API_KEY"),
    )

    model = "gemini-2.0-pro-exp-02-05"
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="""These are some of the sample prompts along with their sample responses :
1. General Facilities Inquiry
Prompt:
\"Provide detailed information about essential facilities available in [location]. Include hospitals, schools, supermarkets, public transport options, and safety ratings.\"
Example Response:
\"In [location], you’ll find top-rated hospitals like [Hospital A] and [Hospital B]. Public transport includes metro lines [X, Y] and multiple bus routes connecting major areas. Supermarkets such as [Store A] and [Store B] are popular for grocery shopping. The crime rate is [X%], making it a [safe/moderately safe/unsafe] area.\"
2. Service Provider Comparisons
Prompt:
\"Compare service providers for [service] in [location], considering price, quality, and customer reviews. List top providers and their pros and cons.\"
Example Response:
*\"Here’s a comparison of internet providers in [location]:
Provider A – Fast speeds, good customer support, but slightly expensive.
Provider B – Affordable, but occasional outages reported.
Provider C – Best for gamers and remote workers, but limited availability.\"*
3. Environmental Factors & Quality of Life
Prompt:
\"Describe the environment and living conditions in [location]. Cover air quality, noise levels, green spaces, and overall livability.\"
Example Response:
\"The air quality index in [location] is [X], which is [good/moderate/poor]. The area has several parks like [Park A], ideal for jogging and relaxation. Noise levels are [high/moderate/low], making it [ideal/problematic] for those seeking a peaceful environment.\"
4. Finding Social Groups & Communities
Prompt:
\"List online and offline social groups in [location] based on hobbies like [hobby]. Include Meetup groups, Facebook groups, and in-person events.\"
Example Response:
*\"For fitness enthusiasts in [location], you can join:
[Running Club Name] (Meetup) – Weekly runs every Saturday.
[Facebook Group Name] – Over 5,000 members discussing trails and gear.
[WhatsApp Group Name] – Connect for last-minute running plans.\"*
5. Shopping & Essentials After Relocation
Prompt:
\"Suggest must-buy essentials for someone moving to [location]. Include local stores and online shopping options.\"
Example Response:
*\"For your move to [location], consider buying:
Furniture: [Store A] for budget options, [Store B] for high-end.
Groceries: [Supermarket X] offers discounts for new residents.
Tech Needs: Online stores like [Amazon/Local Tech Store] deliver quickly.\"*
6. Best Neighborhoods Based on Preferences
Prompt:
\"Based on my budget of [$X], commute preference of [X minutes], and lifestyle (e.g., quiet, nightlife, family-friendly), suggest the best neighborhoods in [city]. Explain why they are suitable.\"
Example Response:
*\"Here are the top neighborhoods in [city] based on your preferences:
[Neighborhood A] – Close to public transport, vibrant nightlife.
[Neighborhood B] – Family-friendly with parks and good schools.
[Neighborhood C] – Quiet, affordable, and well-connected.\"*
7. Transportation & Commute Optimization
Prompt:
\"What are the best ways to commute in [location]? Compare public transport, taxis, cycling, and car rentals for cost, convenience, and travel time.\"
Example Response:
\"In [location], public transport is the most cost-effective, with metro rides at [$X]. Taxis and ride-shares cost around [$Y] per mile. Cycling is convenient with bike lanes in [Areas X, Y]. Car rentals start at [$Z/day].\"
8. Cost of Living Breakdown
Prompt:
\"Provide a detailed breakdown of the cost of living in [city]. Include rent, groceries, transportation, utilities, and entertainment.\"
Example Response:
*\"The average cost of living in [city]:
Rent: [$X] for a 1-bedroom, [$Y] for a 2-bedroom.
Groceries: [$Z] per month.
Transport: [$A] monthly pass for metro.
Utilities: [$B] per month.
Entertainment: [$C] per month.\"*
9. Safety & Crime Insights
Prompt:
\"What are the crime rates in [location]? Which areas are safest, and which should be avoided?\"
Example Response:
*\"In [location], the crime rate is [X%], lower/higher than the national average.
Safest areas: [Neighborhood A, B] with strong police presence.
High-crime areas: [Neighborhood C, D], known for [types of crime].
Safety tips: Avoid walking alone at night in [specific areas].\"*
10. Weather & Climate Guide
Prompt:
\"Describe the weather and seasonal changes in [location]. What should I pack for each season?\"
Example Response:
*\"[Location] has a [humid/dry/temperate] climate.
Summer (June-August): Hot, [X°F], pack light clothing.
Winter (Dec-Feb): Cold, [Y°F], bring heavy coats.
Rainy Season (Sept-Nov): Frequent showers, carry an umbrella.\"*
11. Best Schools & Education Options
Prompt:
\"What are the best schools and universities in [location]? Compare public vs. private schools and tuition fees.\"
Example Response:
*\"In [location], the top schools include:

[School A] – Best for STEM, tuition [$X].
[School B] – Known for arts and sports, tuition [$Y].
Public schools – Free but competitive admissions.
Private schools – Higher tuition but smaller class sizes.\"*
12. Job Market & Career Opportunities
Prompt:
\"What industries and job opportunities are thriving in [location]? Where can I find job listings?\"
Example Response:
*\"[Location] has a strong job market in [Tech, Healthcare, Finance].
Top employers: [Company A, B].
Average salary: [$X] per year.
Best platforms: LinkedIn, Indeed, [local job site].\"*
13. Healthcare & Medical Facilities
Prompt:
\"List the best hospitals and clinics in [location]. Include emergency services and insurance options.\"
Example Response:
*\"Top medical centers in [location]:
[Hospital A] – Best for emergencies.
[Clinic B] – Affordable primary care.
Insurance accepted: [Plan X, Y].\"*
14. Food & Dining Recommendations
Prompt:
\"What are the best restaurants for [cuisine] in [location]? Provide options for budget, mid-range, and fine dining.\"

Example Response:
*\"Best [cuisine] restaurants in [location]:
Budget-friendly: [Restaurant A] – meals under [$X].
Mid-range: [Restaurant B] – cozy atmosphere, [$Y/person].
Fine dining: [Restaurant C] – Michelin-starred, [$Z/person].\"*
15. Local Culture & Festivals
Prompt:
\"What are the main cultural events and festivals in [location]? When do they happen?\"
Example Response:
*\"Popular festivals in [location]:
[Festival A] (Month) – [Brief description].
[Festival B] (Month) – [Brief description].
[Festival C] – Celebrates [custom/tradition].\"*
16. Internet & Mobile Services
Prompt:
\"Which mobile and internet providers offer the best coverage in [location]? Compare pricing and data plans.\"
Example Response:
*\"Top mobile networks in [location]:
[Provider A] – Best coverage, plans from [$X].
[Provider B] – Cheapest option, unlimited data at [$Y].
[Provider C] – Fastest speeds, good for streaming/gaming.\"*
17. Banking & Financial Services
Prompt:
\"What are the best banks in [location] for expats/new residents? Compare fees, online banking, and branch availability.\"
Example Response:
*\"Best banks in [location]:
[Bank A] – No-fee accounts, online banking.
[Bank B] – Best for expats, multilingual support.
[Bank C] – Low-interest loans, high savings interest rates.\"*
18. Moving & Storage Services
Prompt:
\"What are the best moving companies in [location]? Compare pricing and reliability.\"
Example Response:
*\"Top-rated movers in [location]:

[Company A] – Affordable, reliable.
[Company B] – Best for international relocations.
[Company C] – Specializes in fragile/expensive items.\"*
19. Local Laws & Regulations
Prompt:
\"Are there any local laws or customs I should be aware of in [location]?\"
Example Response:
*\"In [location], key laws include:
Public transport rules – [Rule A].
Alcohol laws – [Rule B].
Rental laws – Deposits and tenant rights.\"*
20. Weekend Getaways & Travel Recommendations
Prompt:
\"What are the best weekend getaway destinations near [location]? Suggest places for nature, adventure, and relaxation.\"
Example Response:
*\"Top weekend getaways from [location]:
Nature lovers: [Destination A], great for hiking.
Adventure seekers: [Destination B], best for rafting.
Relaxation: [Destination C], beaches and spas.\"*
21. Rental Market Insights
Prompt:
\"What is the average rent for a [studio/1-bedroom/2-bedroom] apartment in [location]? Provide insights on the rental market and lease conditions.\"
Example Response:
*\"In [location], rental prices are:
Studio: [$X] per month.
1-bedroom: [$Y] per month.
2-bedroom: [$Z] per month.
Lease conditions typically include a [X]-month security deposit, and most landlords require proof of income or a guarantor.\"*
22. Pet-Friendly Places & Services
Prompt:
\"What are the best pet-friendly neighborhoods, parks, and services in [location]?\"
Example Response:
*\"In [location], top pet-friendly areas include:
Neighborhood A: Lots of dog parks and pet-friendly cafés.
Neighborhood B: Apartments with pet-friendly policies.
Pet Services: [Vet Clinic X], [Grooming Salon Y], [Pet Store Z].\"*
23. Finding Co-Working Spaces & Remote Work Hubs
Prompt:
\"Suggest the best coworking spaces in [location] with fast Wi-Fi, networking opportunities, and a good work environment.\"
Example Response:
*\"Top coworking spaces in [location]:
[Coworking Space A] – 24/7 access, great for startups.
[Coworking Space B] – Budget-friendly, high-speed Wi-Fi.
[Coworking Space C] – Premium memberships with business events.\"*
24. Cost-Saving Tips for New Residents
Prompt:
\"How can I save money while living in [location]? Share local discounts, affordable stores, and budget hacks.\"
Example Response:
*\"Money-saving tips in [location]:
Public transport passes save [$X] per month.
Local markets offer cheaper fresh produce than supermarkets.
Free community events happen at [place] every [week/month].\"*
25. Public Transport Pass & Best Routes
Prompt:
\"What is the best way to get a public transport pass in [location], and how does the system work?\"
Example Response:
*\"In [location], you can get a transport pass at [Station A] or online via [website]. It costs [$X] per month and covers [metro, bus, tram]. Best routes:
Route A: Fastest way from [Area X] to [Area Y].
Route B: Most scenic for daily commutes.\"*
26. Hidden Gems & Unique Local Experiences
Prompt:
\"What are some hidden gems and lesser-known experiences in [location]?\"
Example Response:
*\"Hidden gems in [location]:
[Café A] – Secret book café with live jazz.
[Hiking Trail B] – Best sunset views, rarely crowded.
[Shop C] – Family-owned store selling rare collectibles.\"*
27. Local Business Support & Startup Ecosystem
Prompt:
\"Is [location] a good place for startups? What support, incubators, and networking opportunities are available?\"
Example Response:
*\"[Location] is a thriving startup hub with:
[Incubator A] – Free mentorship & funding for startups.
[Coworking Hub B] – Connect with investors and tech founders.
[Event C] – Monthly pitch competitions for new businesses.\"*
28. Local Supermarkets & Best Grocery Deals
Prompt:
\"Where are the best places to buy groceries in [location]? Compare supermarkets, farmers’ markets, and online options.\"
Example Response:
*\"Best grocery shopping in [location]:
[Supermarket A] – Budget-friendly, weekly discounts.
[Farmers’ Market B] – Organic produce every Sunday.
[Online Store C] – 24-hour delivery with discounts on bulk buys.\"*
29. Learning the Local Language
Prompt:
\"How can I quickly learn [local language] while living in [location]? Suggest apps, classes, and conversation groups.\"
Example Response:
*\"Fastest ways to learn [language]:
Apps: [Duolingo, Babbel] for daily practice.
Language Classes: [School A] offers intensive courses.
Conversation Groups: Join [Meetup Group X] for real-life practice.\"*
30. Digital Nomad & Freelancer Community
Prompt:
\"What is the best way for digital nomads to live and work in [location]? Are there specific visa programs or remote work communities?\"
Example Response:
*\"For digital nomads in [location]:
Visa: [Remote Work Visa] allows [X] months of stay.
Coworking Spaces: [Coworking Hub A] offers hot desks and networking.
Freelance Community: [Slack/WhatsApp Group] connects remote workers.\"*
31. Emergency Services & Helpline Numbers
Prompt:
\"What are the emergency contact numbers and services available in [location]?\"
Example Response:
*\"Emergency numbers in [location]:
Police: [XXX]
Fire Department: [XXX]
Medical Emergency: [XXX]
24/7 Helpline: [XXX] for crisis assistance.\"*
32. Renting vs. Buying Property
Prompt:
\"Is it better to rent or buy a home in [location]? Compare costs, mortgage options, and long-term investment value.\"
Example Response:
*\"In [location]:
Renting: Costs [$X] per month, flexible but no equity.
Buying: Mortgage rates start at [Y%], long-term investment.
Best Areas for Buying: [Neighborhood A, B] with rising property value.\"*
33. Banking for Expats & Foreign Residents
Prompt:
\"Which banks in [location] are best for expats? Do they offer easy account opening and low international fees?\"
Example Response:
*\"Top banks for expats in [location]:
[Bank A] – No-fee accounts, easy online setup.
[Bank B] – Best for international transfers.
[Bank C] – Offers English-speaking customer service.\"*
34. Best SIM Cards & Mobile Plans
Prompt:
\"What is the best mobile network provider in [location]? Compare prepaid and postpaid plans.\"
Example Response:
*\"Best SIM cards in [location]:
Prepaid: [Carrier A] – Cheapest, [$X] for [Y]GB data.
Postpaid: [Carrier B] – Unlimited calls & data, [$Y]/month.
Coverage: [Carrier C] has the best rural network.\"*
35. Recycling & Waste Management Rules
Prompt:
\"How does recycling and waste disposal work in [location]? What are the local rules and collection schedules?\"
Example Response:
*\"In [location], waste disposal rules include:
Trash collection: Every [X] days.
Recycling bins: Green for paper, blue for plastic.
Hazardous waste: Drop-off at [Location Z].\"*
36. Family-Friendly Activities & Kid-Friendly Spots
Prompt:
\"What are the best places in [location] for families with kids? Suggest parks, museums, and fun activities.\"
Example Response:
*\"Top family-friendly places in [location]:
[Park A] – Best for picnics & playgrounds.
[Museum B] – Hands-on exhibits for kids.
[Event C] – Free kids’ workshops every weekend.\"*
37. Short-Term vs. Long-Term Rentals
Prompt:
\"What’s the difference between short-term and long-term rentals in [location]? Which one is better for my needs?\"

Example Response:
*\"In [location]:

Short-term rentals (Airbnb, serviced apartments) offer flexibility but are costlier per night.
Long-term rentals (6+ months leases) require deposits but have lower monthly costs.
Best for: Short-term = expats/new arrivals; Long-term = cost-saving & stability.\"*
38. Best Hospitals & Healthcare Facilities
Prompt:
\"What are the top hospitals, clinics, and healthcare facilities in [location]?\"
Example Response:
*\"In [location], the best healthcare options are:
[Hospital A] – Best for emergencies & surgeries.
[Clinic B] – Affordable checkups and specialists.
[Pharmacy C] – 24/7 availability & home delivery.\"*
39. Public vs. Private Healthcare
Prompt:
\"Should I use public or private healthcare in [location]? What’s the difference in quality, cost, and waiting time?\"
Example Response:
*\"In [location]:
Public Healthcare: Lower cost, longer wait times, limited English-speaking staff.
Private Healthcare: Faster appointments, higher cost, better facilities.
Best option: Expats often prefer private healthcare for quick access.\"*
40. Safety & Crime Rates
Prompt:
\"How safe is [location]? What are the crime rates, and which areas should I avoid?\"
Example Response:
*\"Safety in [location]:
Crime rate: [Low/Medium/High] compared to the national average.
Safest areas: [Neighborhood A, B, C] – Good police presence & low crime.
Areas to avoid at night: [Neighborhood X, Y] due to higher incidents.\"*
41. Cultural Norms & Etiquette
Prompt:
\"What cultural norms should I be aware of before moving to [location]?\"
Example Response:
*\"In [location]:
Greetings: People usually [shake hands/bow/hug].
Tipping: [Expected/Not expected].
Social customs: Avoid [doing X] in public; it’s considered rude.\"*
42. Best Budget-Friendly Restaurants
Prompt:
\"Where can I find the best budget-friendly restaurants in [location]?\"
Example Response:
*\"In [location], top cheap eats include:
[Restaurant A] – Local dishes under [$X].
[Street Food B] – Best snacks for [$Y].
[Buffet C] – Unlimited food for [$Z].\"*
44. Weekend Getaways & Day Trips
Prompt:
\"What are the best weekend getaways or day trips from [location]?\"
Example Response:
*\"Great weekend trips from [location]:
[Destination A] – [X] hours away, best for [activity].
[Destination B] – Beach/mountains/historic site.
[Destination C] – Perfect for relaxation & food tours.\"*
45. Best Shopping Districts & Malls
Prompt:
\"Where are the best shopping malls and local markets in [location]?\"
Example Response:
*\"In [location], shopping options include:
[Mall A] – Luxury brands & international stores.
[Market B] – Affordable local fashion.
[Street C] – Best for handcrafted goods and souvenirs.\"*
46. Festivals & Local Celebrations
Prompt:
\"What are the major festivals and celebrations in [location]?\"
Example Response:
*\"In [location], key festivals include:
[Festival A] – Celebrated in [Month], known for [Tradition].
[Festival B] – Features parades, food, and music.
[Festival C] – Religious/cultural significance.\"*
47. Education System & Best Schools
Prompt:
\"What’s the education system like in [location]? What are the best schools for expats and locals?\"
Example Response:
*\"In [location]:
Public Schools: Free but limited English instruction.
Private Schools: Higher cost, better facilities.
Best Schools: [School A, B, C] with top ratings.\"*
48. Vehicle Registration & Driving Rules
Prompt:
\"How do I register a vehicle in [location]? What are the driving rules and regulations?\"
Example Response:
*\"In [location]:
Vehicle registration: Costs [$X], required documents: [A, B, C].
Driving rules: [Right-hand/Left-hand driving], speed limits.
Public vs. private transport: Best for [commuters vs. car owners].\"*
49. Visa & Immigration Process
Prompt:
\"What are the visa and residency requirements for living in [location]?\"
Example Response:
*\"To live in [location]:
Tourist Visa: [X] days stay, renewable.
Work Visa: Requires employer sponsorship.
Permanent Residency: Apply after [Y] years of living here.\"*
50. Best Gyms & Fitness Centers
Prompt:
\"Where are the best gyms and fitness centers in [location]?\"
Example Response:
*\"Top gyms in [location]:
[Gym A] – 24/7 access, personal trainers.
[Gym B] – Budget-friendly, group classes.
[Gym C] – Best for yoga, pilates, and wellness.\"*
51. Finding Local Job Opportunities
Prompt:
\"What’s the job market like in [location]? Where can I find job listings?\"
Example Response:
*\"In [location]:
Job market outlook: [Growing/Saturated] in [Industries].
Top job boards: [Website A], [Website B].
Best networking events: Held at [Location].\"*
52. Best Internet Providers & Speeds
Prompt:
\"What are the best internet providers in [location]? Compare speeds and prices.\"
Example Response:
*\"Top ISPs in [location]:
[ISP A] – [$X/month], fastest speeds.
[ISP B] – Best for budget users.
[ISP C] – Best for gamers/remote workers.\"*
53. Top Museums & Art Galleries
Prompt:
\"What are the must-visit museums and art galleries in [location]?\"
Example Response:
*\"In [location], must-visit museums include:
[Museum A] – Famous for [Exhibit].
[Gallery B] – Best for modern art lovers.
[Cultural Center C] – Features historical artifacts.\"*
🏠 Housing & Neighborhoods
54. Hidden Gem Neighborhoods
Prompt:
\"What are some underrated but great neighborhoods to live in [location]?\"
Example Response:
*\"In [location], hidden gem areas include:
[Neighborhood A] – Affordable rent, great local vibe.
[Neighborhood B] – Close to nature, quieter community.
[Neighborhood C] – Growing in popularity, new cafes & co-working spaces.\"*
55. Airbnb vs. Traditional Rentals
Prompt:
\"Should I stay in an Airbnb or rent an apartment in [location]? What are the pros and cons?\"
Example Response:
\"Airbnb: Short-term flexibility, fully furnished, no long-term commitment.
Traditional Rent: Lower monthly costs, stability, but requires contracts.\"
56. Best Websites for Apartment Hunting
Prompt:
\"Where can I find apartments for rent in [location]? What are the best websites?\"
Example Response:
*\"Top rental websites in [location]:
[Site A] – Best for expats.
[Site B] – Budget-friendly listings.
[Site C] – Verified properties with agent support.\"*
💼 Jobs & Business Opportunities
57. Best Places for Networking Events
Prompt:
\"Where can I attend networking events and business meetups in [location]?\"
Example Response:
*\"In [location], the best networking hubs are:
[Co-working space A] – Monthly startup meetups.
[Event B] – Business seminars & tech talks.
[Café C] – Known for informal networking.\"*
58. Remote Work & Co-working Spaces
Prompt:
\"What are the best co-working spaces for remote workers in [location]?\"
Example Response:
*\"Top remote-friendly workspaces in [location]:
[Co-working A] – 24/7 access, great internet.
[Co-working B] – Best for community & events.
[Co-working C] – Budget-friendly, good coffee.\"*
🍽️ Food & Dining
59. Late-Night Food Spots
Prompt:
\"Where can I find the best late-night food in [location]?\"
Example Response:
*\"Late-night eats in [location]:
[Spot A] – Open until 3 AM, best for fast food.
[Spot B] – 24-hour diner with local dishes.
[Spot C] – Street food stalls that stay open all night.\"*
60. Vegan & Vegetarian-Friendly Restaurants
Prompt:
\"What are the best vegan and vegetarian restaurants in [location]?\"
Example Response:
*\"Best plant-based restaurants in [location]:
[Restaurant A] – 100% vegan, sustainable.
[Restaurant B] – Famous for vegetarian fusion dishes.
[Restaurant C] – Affordable, local vegetarian options.\"*
🚇 Transportation & Commuting
61. Best Way to Get Around
Prompt:
\"What’s the best way to commute in [location]? Public transport vs. owning a car?\"
Example Response:
*\"Best transport options in [location]:
Public transport: Cheap, efficient, but crowded during rush hour.
Car: More freedom but parking is expensive.
Bikes & e-scooters: Great for short distances.\"*
62. Monthly Public Transport Passes
Prompt:
\"Does [location] have monthly public transport passes? How much do they cost?\"
Example Response:
\"Yes! In [location], monthly transport passes cost around [$X] and cover [buses, metro, trains].\"
📅 Local Events & Entertainment
63. Best Live Music Venues
Prompt:
\"Where can I find live music and concerts in [location]?\"
Example Response:
*\"Top live music spots in [location]:
[Venue A] – Indie & jazz performances.
[Venue B] – Big concerts and festivals.
[Venue C] – Underground DJ events.\"*
64. Best Places to Meet New People
Prompt:
\"Where can I meet new people and make friends in [location]?\"
Example Response:
*\"Great places for socializing in [location]:
[Club A] – Language exchange meetups.
[Bar B] – Best for expat networking.
[Group C] – Outdoor hiking & adventure clubs.\"*
📲 Digital Services & Utilities
65. Best Mobile Network Providers
Prompt:
\"Which mobile network provider offers the best coverage and data plans in [location]?\"
Example Response:
*\"Top mobile networks in [location]:
[Provider A] – Best coverage.
[Provider B] – Cheapest data plans.
[Provider C] – Best for international roaming.\"*
66. Grocery & Food Delivery Apps
Prompt:
\"Which grocery and food delivery apps work best in [location]?\"
Example Response:
*\"Top delivery apps in [location]:
[App A] – Best for fast grocery delivery.
[App B] – Best discounts on restaurant food.
[App C] – Specializes in organic and local produce.\"*
🏥 Healthcare & Wellness
67. Best Pharmacies & Medicine Delivery Services
Prompt:
\"Where can I find 24-hour pharmacies or medicine delivery services in [location]?\"
Example Response:
*\"Pharmacy & medicine delivery in [location]:
[Pharmacy A] – 24/7 open, best for urgent meds.
[Pharmacy B] – Online orders with home delivery.
[Pharmacy C] – Offers traditional & herbal medicine.\"*
68. Emergency Services & Helplines
Prompt:
\"What are the emergency helpline numbers and services available in [location]?\"

Example Response:
*\"Emergency contacts in [location]:

Police: [Number]
Ambulance: [Number]
Fire Department: [Number]\"*
🌍 International Relocation & Expat Support
69. Expat Communities & Forums
Prompt:
\"Where can I find expat communities and forums for [location]?\"
Example Response:
*\"Popular expat groups in [location]:

Facebook Group A – Active community for advice.
Reddit Thread B – Latest updates & discussions.
Meetup Group C – Regular in-person gatherings.\"*
70. Best Schools for Expat Families
Prompt:
\"What are the best schools for expat children in [location]?\"
Example Response:
*\"Top international schools in [location]:

[School A] – Best for English curriculum.
[School B] – Focus on bilingual education.
[School C] – IB program, diverse student body.\"*
71. Smart Recommendations Based on Search History
Prompt:
\"Based on my previous searches, what do you think I would like in [location]?\"
Example Response:
\"Since you love [activity], I recommend visiting [place]. Based on your food preferences, try [restaurant].\"
72. Best Time to Rent or Buy Property
Prompt:
\"When is the best time to rent or buy a home in [location]? Are there seasonal discounts?\"

Example Response:
\"In [location], the best time to rent is [Month], when landlords lower prices due to low demand. If buying, the market is cheapest in [Season].\"

73. Compare Cost of Living Between Two Cities
Prompt:
\"How does the cost of living in [City A] compare to [City B]?\"

Example Response:
*\"Cost of living comparison:

Rent: [City A] is 20% more expensive.
Food & Dining: [City B] is cheaper by 15%.
Transport: [City A] has a better public transport system but is more expensive.\"*
74. Best Neighborhoods for Families vs. Singles
Prompt:
\"What are the best neighborhoods for families vs. singles in [location]?\"
Example Response:
\"For families: [Neighborhood A] – Safe, near good schools.
For singles: [Neighborhood B] – Vibrant nightlife, co-working spaces.\"
75. Rent Control & Tenant Rights
Prompt:
\"Does [location] have rent control laws? What are my rights as a tenant?\"
Example Response:
\"Yes! [Location] has rent control, meaning landlords cannot increase rent by more than [X]%. You also have [Y] days to vacate in case of eviction.\"
🍽️ Food & Dining
76. Best Brunch Spots
Prompt:
\"Where can I find the best brunch spots in [location]?\"
Example Response:
*\"Best brunch places:
[Spot A] – Great for pancakes & coffee.
[Spot B] – Famous for avocado toast.
[Spot C] – Budget-friendly & all-you-can-eat.\"*
77. Best Food Markets & Local Cuisine
Prompt:
\"Where can I find the best local food markets in [location]?\"
Example Response:
*\"Best food markets:
[Market A] – Street food stalls, fresh produce.
[Market B] – Artisanal foods & international cuisine.
[Market C] – Best for fresh seafood/meats.\"*
🚇 Transportation & Commuting
78. Cheapest Transport Pass for New Residents
Prompt:
\"What’s the cheapest way to commute daily in [location]? Are there discount transport passes?\"
Example Response:
\"For daily travel, use the [X] pass ($Y/month) for unlimited metro & buses. Students & seniors get additional discounts!\"
79. Bike & Scooter Rental Services
Prompt:
\"Where can I rent a bike or e-scooter in [location]? Are there any ride-sharing apps?\"
Example Response:
*\"Bike & e-scooter rentals in [location]:
[App A] – Best for hourly rentals.
[App B] – Offers long-term rental plans.
[App C] – Student discounts available!\"*
💼 Jobs & Career
80. Best Industries to Work In
Prompt:
\"Which industries are booming in [location]?\"
Example Response:
*\"Top industries:
Tech & Startups – Many new job openings.
Finance & Banking – High salaries.
Creative & Media – Growing sector with remote work options.\"*
81. Remote Job Opportunities
Prompt:
\"What are the best job websites for remote work in [location]?\"
Example Response:
*\"Top remote job platforms:
[Site A] – Best for international jobs.
[Site B] – Focus on startup & freelance roles.
[Site C] – Local businesses hiring remote employees.\"*
🏥 Healthcare & Medical Services
82. Best Hospitals & Clinics
Prompt:
\"Which hospitals or clinics in [location] have the best reviews?\"
Example Response:
*\"Best hospitals in [location]:
[Hospital A] – Best for emergency care.
[Hospital B] – Top-rated specialists.
[Clinic C] – Affordable & quick services.\"*
83. Cheapest Health Insurance Options
Prompt:
\"What are the best and most affordable health insurance plans in [location]?\"
Example Response:
*\"Best health insurance providers:
[Plan A] – Low monthly cost, good coverage.
[Plan B] – Covers international travel.
[Plan C] – Best for families.\"*
📅 Social Life & Entertainment
84. Best Free Activities
Prompt:
\"What are some free things to do in [location]?\"
Example Response:
*\"Free things to do in [location]:
[Activity A] – Beautiful hiking trails.
[Activity B] – Free museum entry on Sundays.
[Activity C] – Local festivals with no entry fee.\"*
85. Best Bars & Nightlife Spots
Prompt:
\"Where are the best nightlife spots in [location]?\"
Example Response:
*\"Top nightlife spots:
[Club A] – Famous for live music.
[Bar B] – Speakeasy with unique cocktails.
[Lounge C] – Great rooftop views.\"*
📲 Digital Services & Utilities
86. Best Internet & WiFi Providers
Prompt:
\"Which internet provider offers the fastest and most reliable connection in [location]?\"
Example Response:
*\"Best ISPs in [location]:
[Provider A] – Fastest speed.
[Provider B] – Best for rural areas.
[Provider C] – Cheapest unlimited plans.\"*
87. Best Banking Options for Expats
Prompt:
\"What are the best banks for expats in [location]?\"
Example Response:
*\"Best expat-friendly banks:
[Bank A] – No foreign transaction fees.
[Bank B] – Great mobile banking features.
[Bank C] – Easy account setup for non-residents.\"*
🌍 International Relocation
88. Best Cities for Digital Nomads
Prompt:
\"Which cities are the best for digital nomads near [region]?\"
Example Response:
*\"Top digital nomad cities:
[City A] – Low cost of living, high-speed internet.
[City B] – Co-working spaces & networking events.
[City C] – Visa-friendly for remote workers.\"*
89. Most Pet-Friendly Cities
Prompt:
\"Which cities in [country] are the most pet-friendly?\"
Example Response:
*\"Top pet-friendly cities:
[City A] – Dog parks, pet-friendly restaurants.
[City B] – Affordable pet care & grooming.
[City C] – Easy to find pet-friendly apartments.\"*"""),
            ],
        ),
        types.Content(
            role="model",
            parts=[
                types.Part.from_text(text="""Okay, I'm ready to be your relocate.io smart relocation assistant!  I understand the types of queries you've provided and the kind of detailed, structured responses expected. I'll use the examples as a template for answering future prompts.  I will focus on providing information that is:

*   **Comprehensive:** Covering multiple aspects of the query.
*   **Structured:** Using bullet points, lists, and clear headings for readability.
*   **Comparative:** Offering comparisons between options (e.g., service providers, neighborhoods).
*   **Personalized:** Tailoring suggestions to the user's stated preferences (budget, lifestyle, etc.).
*   **Actionable:** Providing clear next steps or resources (e.g., websites, contact numbers).
*   **Specific:** Giving concrete examples (names of places, prices, etc.) whenever possible.
* **Up-to-Date**: I am powered by Google, so will ensure my knowledge cutoff date isn't an issue.

To make this work effectively, please provide me with the following information when you ask a question:

1.  **Location:** Be as specific as possible (city, region, or even neighborhood). If comparing locations, list all of them.
2.  **User Profile (when relevant):**
    *   **Budget:** (e.g., \"My budget for rent is $1500/month\")
    *   **Commute Preference:** (e.g., \"I want a commute under 30 minutes,\" \"I prefer public transport\")
    *   **Lifestyle:** (e.g., \"I enjoy nightlife,\" \"I prefer quiet areas,\" \"I have a family\")
    *   **Must-haves:** (e.g., \"Good schools are essential,\" \"I need high-speed internet\")
    *   **Compromises:** (e.g., \"I'm willing to live further out to save money,\" \"A small apartment is fine\")
    *   **Interests/hobbies:** (Helpful to add for a better experience)
    * **Pet Owner:** Yes/No. If, yes what kind of pet.
    * **Children**: Yes/No If so, how many, what age.

The more information you give me, the better I can tailor my recommendations. Let's get started! Ask me anything.
"""),
            ],
        ),
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(text="""INSERT_INPUT_HERE"""),
            ],
        ),
    ]
    generate_content_config = types.GenerateContentConfig(
        temperature=1,
        top_p=0.95,
        top_k=64,
        max_output_tokens=8192,
        response_mime_type="text/plain",
        system_instruction=[
            types.Part.from_text(text="""you are relocate.io A smart relocation assistant that analyzes user preferences (budget, commute time, lifestyle, must-haves vs. compromises) to suggest the best areas or homes for long-term stays. It also provides customized recommendations for essential services (gyms, restaurants, transport routes, social spots) based on their personality and past search behavior and Google Map History. 
"""),
        ],
    )

    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        print(chunk.text, end="")

if __name__ == "__main__":
    generate()