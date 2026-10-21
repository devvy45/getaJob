import csv

# Block 1: jobs already live in the sheet (from the dump). Format:
# id,person_name,person_headline,company,role,category,location,excerpt,published_at,source_url,initials,accent,active
block1 = [
 ["pre6ai-engineer-scientific-computing","Vipul Vaibhaw","Cofounder at Pre6AI","Pre6AI","Engineer - Scientific Computing","Engineering","Bengaluru","We're hiring an engineer for scientific computing (C++/Rust) - pick up a CFD/simulation paper, understand the math, build production numerical solvers and push them hard on GPUs. Deep ownership, small team, 100th percentile salary.","2026-09-02","https://x.com/vaibhaw_vipul/status/2095040765630239228","VV","#2e6b9a","TRUE"],
 ["aydusco-marketing-team","Eashan Shetty","Hiring at Aydus","Aydus","Marketing Team","Growth","Bengaluru","We're building the most talent-dense marketing team out of Bangalore working on campaigns seen by 1/3rd of the US population. Clients include The North Face, Deel and Polymarket.","2026-09-02","https://x.com/EashanShetty/status/2093299664250650783","ES","#b26a45","TRUE"],
 ["okara-growth-pm-seo","Okara","Company at Okara","Okara","Growth PM (SEO & AI Visibility)","Growth","San Francisco","Open role at Okara - Growth PM focused on SEO and AI visibility.","2026-09-02","https://x.com/askOkara/status/2094791028607975492","OK","#5a8a6e","TRUE"],
 ["okara-full-stack-engineer","Okara","Company at Okara","Okara","Full Stack Engineer","Engineering","San Francisco","Open role at Okara - Full Stack Engineer.","2026-09-02","https://x.com/askOkara/status/2094791028607975492","OK","#5a8a6e","TRUE"],
 ["okara-staff-engineer","Okara","Company at Okara","Okara","Staff Engineer","Engineering","San Francisco","Open role at Okara - Staff Engineer.","2026-09-02","https://x.com/askOkara/status/2094791028607975492","OK","#5a8a6e","TRUE"],
 ["okara-product-designer","Okara","Company at Okara","Okara","Product Designer","Design","San Francisco","Open role at Okara - Product Designer.","2026-09-02","https://x.com/askOkara/status/2094791028607975492","OK","#5a8a6e","TRUE"],
 ["okara-creative-lead","Okara","Company at Okara","Okara","Creative Lead","Marketing","San Francisco","Open role at Okara - Creative Lead.","2026-09-02","https://x.com/askOkara/status/2094791028607975492","OK","#5a8a6e","TRUE"],
 ["okara-growth-pm-paid","Okara","Company at Okara","Okara","Growth PM (Paid Ads)","Growth","San Francisco","Open role at Okara - Growth PM focused on paid ads.","2026-09-02","https://x.com/askOkara/status/2094791028607975492","OK","#5a8a6e","TRUE"],
 ["openrouter-community-lead","jacky","Hiring at OpenRouter","OpenRouter","Community Lead (Developer Relations)","Growth","Remote (US)","Own and grow OpenRouter's developer community, home to one of the largest AI Discords with 50,000+ members. Building automations, scaling moderator programs, and running events. 3+ years community experience required.","2026-09-02","https://x.com/jjacky/status/2094876401379824121","JJ","#5a7fbd","TRUE"],
 ["pixelup-growth-intern","Daksh","Founder at PixelUp","PixelUp","Growth & Generalist Intern","Growth","Bengaluru","Hiring 2-3 growth and generalist interns for a 30-day PixelUp hacker house in Bengaluru. 60k/mo stipend, flights, food and accommodation covered, in-person only.","2026-09-02","https://x.com/dakshpixelup/status/2094142778121064836","DA","#8a5aa6","TRUE"],
 ["deepwork-labs-ai-engineer","Pratham Bhatnagar","Founder at Deepwork Labs","Deepwork Labs","AI Engineer","Engineering","Bengaluru","Hiring an AI engineer to build scalable AI agents and ship to production, design real evals, and benchmark models. Python/FastAPI, React/Next.js, Postgres, Redis, vector DBs. Own features end to end.","2026-09-02","https://x.com/prathamqq/status/2092523656635396397","PB","#c2603f","TRUE"],
 ["namanyay-growth-intern","Namanyay","Hiring at Namanyay","Namanyay","Growth Intern (Remote)","Growth","Remote","Hiring a remote growth intern, no resume needed. DM with the number of views you've generated and how, to prove your results.","2026-09-02","https://x.com/NamanyayG/status/2095018090434326721","NA","#c09b3f","TRUE"],
 ["wynters0ul-content-creator","Wynter","Hiring at Wynters0ul","Wynter","On-Screen Content Creator","Marketing","Remote","Looking for an on-screen content creator well-versed in investing topics and trends, fluent in English, understands viral TikTok and IG trends, great on camera and at video editing. DM with portfolio.","2026-08-31","https://x.com/wynters0ul/status/2094354448571310103","WS","#9a5a7f","TRUE"],
 ["fastlane-head-of-growth","Gaurav","Hiring at Fastlane","Fastlane","Head of Growth","Growth","Sydney / SF","Own Fastlane's growth engine: paid acquisition (Meta, Google, TikTok), SEO and AI search, UGC, influencers, affiliates and CRO. Hyper-scale the product globally. Competitive salary plus equity.","2026-09-02","https://x.com/gauravsbuilding/status/2095037436552470806","GA","#5a8a5a","TRUE"],
 ["fastlane-head-of-content","Gaurav","Hiring at Fastlane","Fastlane","Head of Content","Marketing","Sydney / SF","Run social end to end for Fastlane and the founders' personal brands. Great on camera, writing scripts, shooting, editing and posting at volume. Make Fastlane the most famous company in marketing.","2026-09-02","https://x.com/gauravsbuilding/status/2095037436552470806","GA","#5a8a5a","TRUE"],
 ["fastlane-creative-director","Gaurav","Hiring at Fastlane","Fastlane","Creative Director","Marketing","Sydney / SF","Experienced videographer with incredible taste embedded inside the company. Turn the Fastlane journey into world class long form and short form content, the most addictive startup series to watch.","2026-09-02","https://x.com/gauravsbuilding/status/2095037436552470806","GA","#5a8a5a","TRUE"],
 ["rachitonthekey-product-designer","Rachit","","Rachit","Product Designer","Design","Remote","Hiring a Product Designer with 3+ years experience, preferably in B2B SaaS, financial platforms, or complex web applications. DM to apply or refer.","2026-09-01","https://x.com/rachitonthekey/status/2094788152196304940","RA","#7a5a9a","TRUE"],
 ["newton-school-fde-intern","neembu_paani31","Hiring at Newton School","Newton School","FDE Intern","Engineering","Bengaluru","Hiring 1 FDE intern, high agency. 50k/month stipend, on-site in Bangalore. Work with Python, Next.js and infrastructure, high ownership end to end.","2026-09-01","https://x.com/neembu_paani31/status/2094845613078872171","NS","#3f9a8a","TRUE"],
 ["oneassure-content-intern","takeiteasyUrvy","Hiring at OneAssure","OneAssure","Content Intern","Marketing","Bengaluru","Hiring a content intern. Research and write Twitter content, support creator partnerships and content IPs, and run YouTube ops once launched. In-office in Indiranagar, Bangalore. DM with your best content.","2026-09-02","https://x.com/takeiteasyUrvy/status/2095103440921969000","OA","#9a8a3f","TRUE"],
 ["frontiers-ai-lab-pretraining-intern","Vishesh Tripathi","Hiring at Frontiers AI Lab","Frontiers AI Lab","Intern (Pre-Training Team)","Engineering","Bengaluru","Hiring an intern for the pre-training team, on-site in Bangalore. Need expertise in data pre-processing.","2026-09-02","https://x.com/vishesh_t27/status/2094880675187048830","VT","#5a7f9a","TRUE"],
 ["hermitinhell-reddit-va","Akshat","Hiring","","Reddit VA / Intern","Growth","Remote","Hiring Reddit VAs or interns who understand internet culture, have 4-5 hrs/day, and have used Reddit before. Best for college students. Fully remote, 150-250/month, strong chance of full-time.","2026-09-04","https://x.com/HermitinHell/status/2095769243216429159","AK","#7a8a3f","TRUE"],
 ["oasis-head-of-growth","Cormac Haydon","Hiring at Oasis","Oasis","Founding Head of Growth","Growth","US","Founding head of growth to spread the mission and get test results in front of hundreds of millions of consumers. Build and scale UGC campaigns, launch paid ads, partner with influencers, open SEO and email channels. 944k downloads, 4.8/5 from 13k reviews.","2026-09-04","https://x.com/cormachayden_/status/2095645838899052798","CH","#6a8a5a","TRUE"],
 ["nordicpatrik-website-developer","Patrik","Hiring at Patrik","","Website Developer","Engineering","Remote","Looking for a website developer with serious design taste who can also ship fast. DM with a short introductory video of you and your work.","2026-09-04","https://x.com/NordicPatrik/status/2095777556494524553","NP","#3f6a9a","TRUE"],
 ["dubdub-genz-marketer","Kaustubh Priye","Hiring at Dubdub","Dubdub","GenZ Marketer","Growth","Bangalore","Hiring a GenZ marketer who is very online, gets creators, memes, communities and internet culture, and constantly thinks how to make people talk about the product. Don't care much about years of experience, salary not the issue for the right talent. Apply via binary.so.","2026-09-03","https://x.com/KaustubhPriye/status/2095448847908848068","KP","#9a3f5a","TRUE"],
 ["arushi-gtm-intern","Arushi Gandhi","Hiring at Ressl AI","Ressl AI","GTM Intern","Growth","Bengaluru / Remote","Hiring a GTM intern, 40K-100K INR monthly, Bengaluru or remote in India. Apply via Y Combinator.","2026-09-03","https://x.com/arushi_ressl/status/2095450185573011616","AG","#6a9a3f","TRUE"],
 ["lyzr-ai-fde","Lyzr AI","Company at Lyzr AI","Lyzr AI","Forward Deployed Engineer","Engineering","Bengaluru","One-day FDE hiring drive in Bengaluru: build a real-world AI solution in advance, defend it in a live Shark Tank-style showcase, get an offer the same day.","2026-09-04","https://x.com/lyzr__ai/status/2095784504464158948","LZ","#d5824a","TRUE"],
 ["lyzr-ai-social-media-specialist","Lyzr AI","Company at Lyzr AI","Lyzr AI","Social Media Specialist","Growth","Bengaluru","Elite social team. Own the page, content, and comments. High agency; mostly freshers. Hybrid Bengaluru.","2026-09-02","https://x.com/lyzr__ai/status/2095016127005086078","LZ","#b05a72","TRUE"],
 ["lyzr-ai-graphic-designer","Lyzr AI","Company at Lyzr AI","Lyzr AI","Graphic Designer","Design","Bengaluru","Carousels, thumbnails, white papers, infographics, social-first design. Hybrid Bengaluru.","2026-09-02","https://x.com/lyzr__ai/status/2095016127005086078","LZ","#7a5aa6","TRUE"],
 ["lyzr-ai-video-editor","Lyzr AI","Company at Lyzr AI","Lyzr AI","Video Editor","Media","Bengaluru","Short-form and long-form: product walkthroughs to event cuts. Cut for retention. Hybrid Bengaluru.","2026-09-02","https://x.com/lyzr__ai/status/2095016127005086078","LZ","#3f8a6e","TRUE"],
 ["linear-designer","Karri Saarinen","CEO of Linear","Linear","Designer","Design","North America (remote; hubs SF / NYC / London)","Hiring designers who are great at design. Coding is a plus; they value clarity of thinking and high-quality experiences.","2026-09-04","https://x.com/karrisaarinen/status/2095752800110342475","KS","#5a7f9a","TRUE"],
 ["exo-labs-founding-designer","Alex Funk","At Exo Labs / local.ai","Exo Labs","Founding Designer","Design","San Francisco / London","Hiring a founding designer to shape the future of local / sovereign AI (local.ai).","2026-09-04","https://x.com/alexzfunk/status/2095751282233651231","AF","#9a6a5a","TRUE"],
 ["rightfit-talent-intern","Sumit","Solo-founder at Rightfit","Rightfit","Talent Acquisition Intern","Operations","Bengaluru / Remote","Source engineers and designers across LinkedIn, GitHub, portfolios. Prefer BLR, open to remote. Rs 15k-30k/month.","2026-09-04","https://x.com/wh0sumit/status/2095709962542739476","SU","#b0803f","TRUE"],
 ["prescience-founding-engineer","Rishab Jain","Cofounder at Prescience","Prescience","Founding Engineer / MTS","Engineering","San Francisco","Vertically integrated healthcare system run by medical superintelligence. Founding engineer and MTS roles in SF.","2026-09-04","https://x.com/RishabJainK/status/2095695090274664707","RJ","#3f9a7a","TRUE"],
 ["answerthis-head-of-growth","Ayush Garg","Founder at AnswerThis (YC F25)","AnswerThis","Head of Growth","Growth","San Francisco","Hiring head of growth. Email ayush@answerthis to apply.","2026-09-04","https://x.com/_ayushgarg_/status/2095674663930384722","AG","#8a5a9a","TRUE"],
 ["o3-security-founders-office","O3 Security","Company at O3 Security","O3 Security","Founder's Office","Operations","Bengaluru","Hiring Founder's Office. Apply hello@o3.security.","2026-09-04","https://x.com/O3security/status/2095749210008379548","O3","#4a7f5a","TRUE"],
 ["o3-security-founding-designer","O3 Security","Company at O3 Security","O3 Security","Founding Designer","Design","Bengaluru","Founding designer on cybersecurity problems. Apply hello@o3.security.","2026-09-04","https://x.com/O3security/status/2095749210008379548","O3","#7a4a8a","TRUE"],
 ["o3-security-tech-intern","O3 Security","Company at O3 Security","O3 Security","Tech Intern","Engineering","Bengaluru","Tech intern on cybersecurity. Apply hello@o3.security.","2026-09-04","https://x.com/O3security/status/2095749210008379548","O3","#4a5a8a","TRUE"],
 ["o3-security-gtm-growth-intern","O3 Security","Company at O3 Security","O3 Security","GTM & Growth Intern","Growth","Bengaluru","GTM and growth intern. Apply hello@o3.security.","2026-09-04","https://x.com/O3security/status/2095749210008379548","O3","#5a8a7a","TRUE"],
 ["pumpfun-founding-account-manager","Paul Russo","Employee #1 at pump.fun","pumpdotco","Founding Account Manager","Sales","San Francisco","Founding AM (ideally from AWS) to manage $1B annual volume. SF in person only.","2026-09-03","https://x.com/wolfofmarketst/status/2095659882431308268","PR","#b06a3f","TRUE"],
 ["comma-ai-content-creator","comma","Company at comma.ai","comma.ai","Content Creator","Media","San Diego","Hiring people to make content about comma four. Email work@comma.ai with the best stuff you've made.","2026-09-03","https://x.com/comma_ai/status/2095659058468622344","CO","#3f6a8a","TRUE"],
 ["wafer-mts-steve","Steve","Cofounder at Wafer","Wafer","Member of Technical Staff","Engineering","San Francisco","Kernels, engines + serving; own customer workloads through prod. $200k-$300k + equity. SF 5 days/week.","2026-09-03","https://x.com/gpusteve/status/2095590355085472121","ST","#6a4a8a","TRUE"],
 ["wafer-mts-company","wafer","Company at Wafer","Wafer","Member of Technical Staff","Engineering","San Francisco","Raised $40M Series A. Next MTS works kernels, inference engines, serving infra. $200K-$300K + equity. On-site SF.","2026-09-03","https://x.com/wafer_ai/status/2095585467509150024","WA","#4a6a8a","TRUE"],
 ["conviction-founding-engineer","Tony Yamin","Co-founder at Conviction (YC S25)","Conviction","Founding Engineer","Engineering","San Francisco","Production agentic systems, backend infra, financial data pipelines. $150k-$210k + 0.5-2% equity. In-person SF.","2026-09-03","https://x.com/Tonyyamin_/status/2095562059232731465","TY","#8a4a6a","TRUE"],
 ["aimi-agentic-ai-engineer","Vishnu Swaroop","Founder at AiMi","AiMi","Agentic AI Engineer","Engineering","Remote","Agentic AI for capital markets. TypeScript, Node, AWS Lambda, Mastra, LangChain. 2+ yrs, contract. Must have shipped production AI.","2026-09-03","https://x.com/vswaroop04/status/2095551577893503472","VS","#3f8a5a","TRUE"],
 ["aimi-full-stack-developer","Vishnu Swaroop","Founder at AiMi","AiMi","Full Stack Developer","Engineering","Remote","Full stack developers alongside agentic AI engineers. Remote everywhere, 2+ yrs, contract.","2026-09-03","https://x.com/vswaroop04/status/2095551577893503472","VS","#5a3f8a","TRUE"],
 ["ava-labs-fde","Connor Holliman","Senior Technical Recruiter at Ava Labs","Ava Labs","Senior Forward Deployed Engineer","Engineering","Remote (Global)","Open role building blockchain for businesses.","2026-09-03","https://x.com/jconnorholliman/status/2095550032686744054","CH","#4a8a3f","TRUE"],
 ["ava-labs-staff-avalanchego","Connor Holliman","Senior Technical Recruiter at Ava Labs","Ava Labs","Staff Engineer (AvalancheGo)","Engineering","Brooklyn, NY / Remote (Global)","Staff Engineer on AvalancheGo.","2026-09-03","https://x.com/jconnorholliman/status/2095550032686744054","CH","#8a3f4a","TRUE"],
 ["ava-labs-em-fortary","Connor Holliman","Senior Technical Recruiter at Ava Labs","Ava Labs","Senior Engineering Manager (Fortary Platform)","Engineering","Remote (Global)","Senior EM on the Fortary Platform.","2026-09-03","https://x.com/jconnorholliman/status/2095550032686744054","CH","#3f6a5a","TRUE"],
 ["ava-labs-pm-fortary","Connor Holliman","Senior Technical Recruiter at Ava Labs","Ava Labs","Senior Product Manager (Fortary)","Product","Remote (USA)","Senior PM, Fortary.","2026-09-03","https://x.com/jconnorholliman/status/2095550032686744054","CH","#8a7a3f","TRUE"],
 ["mts-live-product-engineers","Chris Bakke","Co-Founder at MTS Live","MTS Live","Product Engineers","Engineering","San Francisco","X-native media company also building products. Crossing 500K followers and $10M run rate.","2026-09-03","https://x.com/ChrisJBakke/status/2095558490479894852","CB","#3f8a8a","TRUE"],
 ["mts-live-lead-broadcast-engineer","Chris Bakke","Co-Founder at MTS Live","MTS Live","Lead Broadcast Engineer","Engineering","San Francisco","Operate and maintain the main SF production studio. Own production software, cameras, mics.","2026-09-03","https://x.com/ChrisJBakke/status/2095558490479894852","CB","#8a5a3f","TRUE"],
 ["mts-live-producer","Chris Bakke","Co-Founder at MTS Live","MTS Live","Producer","Media","San Francisco","Production, onsites, post. Incubate new shows and go 0 to 1 on MTS Originals.","2026-09-03","https://x.com/ChrisJBakke/status/2095558490479894852","CB","#6a8a3f","TRUE"],
 ["mts-live-hosts-talent","Chris Bakke","Co-Founder at MTS Live","MTS Live","Hosts / Talent","Media","San Francisco","Pivot into media or uplevel existing content with the team.","2026-09-03","https://x.com/ChrisJBakke/status/2095558490479894852","CB","#8a3f6a","TRUE"],
 ["mts-live-sales-partnerships","Chris Bakke","Co-Founder at MTS Live","MTS Live","Sales / Partnerships","Sales","San Francisco / LA / NY","Work directly with the founder to scale partnerships across top tech companies.","2026-09-03","https://x.com/ChrisJBakke/status/2095558490479894852","CB","#3f7a9a","TRUE"],
 ["moment-product-designer","Billy Tseng","Leading design at Moment","Moment","Product Designer","Design","New York","Hiring talented product designers. Careers at moment.com/careers.","2026-09-03","https://x.com/pctseng12/status/2095541354688299313","BT","#7a5a8a","TRUE"],
 ["moment-design-engineer","Billy Tseng","Leading design at Moment","Moment","Design Engineer","Engineering","New York","Hiring design engineers alongside product designers.","2026-09-03","https://x.com/pctseng12/status/2095541354688299313","BT","#5a8a7a","TRUE"],
 ["swoop-founding-brand-designer","Aubrey Darwin Niederhoffer","Founder at Swoop (Thiel Fellow)","Swoop","Founding Brand Designer","Design","Lagos","Shape visual identity from the ground up across visual design, motion, and video. Hybrid Lagos.","2026-09-03","https://x.com/needaubrey/status/2095513706452910143","AD","#8a4a7a","TRUE"],
 ["textbackdoor-first-engineer","Sarvagya Kulshreshtha","At Textbackdoor","Textbackdoor","First Engineer","Engineering","Bengaluru","Moved to Bangalore 3 months ago; now hiring the first engineer. Apply at backdoorai.app/team.","2026-09-03","https://x.com/sarvagya_kul/status/2095502327847481471","SK","#3f9a9a","TRUE"],
 ["alchemyst-founder-office","Nandinyy","Growth at Alchemyst AI","Alchemyst AI","Founder's Office Associate","Operations","Bengaluru / Kolkata","Technical high-agency operator who builds, automates, and ships. Video application required.","2026-09-03","https://x.com/nandiny77300/status/2095484470807998754","NA","#9a3f8a","TRUE"],
 ["spice-ai-founding-ae","Spice AI","Company at Spice AI","Spice AI","Founding Account Executive","Sales","Seattle","Spice AI is hiring a Founding Account Executive.","2026-09-03","https://x.com/spice_ai/status/2095542367424053261","SA","#3f8a4a","TRUE"],
 ["figure-engineering","Brett Adcock","Founder at Figure","Figure","Engineering / AI (general hiring call)","Engineering","Bay Area (Sunnyvale)","Figure announced a $3.5B deal to scale Helix to up to 100,000 Vera Rubin GPUs. Hiring.","2026-09-03","https://x.com/adcock_brett/status/2095555087510937751","BA","#6a3f8a","TRUE"],
 ["launchpoint-engineers","Richard Ahn","Building Launchpoint","Launchpoint","Engineers (full-stack, frontend, backend, AI)","Engineering","New York","Hiring full-time engineers. DM work samples.","2026-09-02","https://x.com/rihntv/status/2095182744372265095","RA","#3f5a8a","TRUE"],
 ["launchpoint-growth-media","Richard Ahn","Building Launchpoint","Launchpoint","Growth and paid media specialists","Growth","New York","Hiring growth and paid media specialists. DM examples of your work.","2026-09-02","https://x.com/rihntv/status/2095182744372265095","RA","#8a6a3f","TRUE"],
 ["petra-labs-growth-engineer","Ramie Khoury","Co-Founder of Petra Labs","Petra Labs","Growth Engineer","Growth","New York","Own experiments across outbound, inbound, paid, events, partnerships and content. DM.","2026-09-02","https://x.com/rvmie_/status/2095153560530895120","RK","#3f7a8a","TRUE"],
 ["petra-labs-strategic-ae","Ramie Khoury","Co-Founder of Petra Labs","Petra Labs","Strategic AE","Sales","New York","Work directly with founders to own the full sales cycle and build the sales motion from scratch.","2026-09-02","https://x.com/rvmie_/status/2095153560530895120","RK","#5a8a4a","TRUE"],
 ["openai-founding-fde","Katie Kirsch","new media at a16z","OpenAI","Founding Forward Deployed Engineer","Engineering","San Francisco","OpenAI spun up a majority-owned deployment arm hiring founding FDEs for up to $400K.","2026-09-02","https://x.com/katiekirsch/status/2095224117813477867","KK","#4a8a7a","TRUE"],
 ["waymo-head-of-logistics","Katie Kirsch","new media at a16z","Waymo","Head of Logistics","Operations","Mountain View","Waymo hiring a Head of Logistics to build the org from empty headcount.","2026-09-02","https://x.com/katiekirsch/status/2095224117813477867","KK","#7a8a4a","TRUE"],
 ["ideogram-first-marketer","Katie Kirsch","new media at a16z","Ideogram","First Marketer","Growth","Toronto / San Francisco","Ideogram hiring its first marketer after marketing lived inside product and engineering.","2026-09-02","https://x.com/katiekirsch/status/2095224117813477867","KK","#8a5a7a","TRUE"],
 ["inferact-founding-designer","Katie Kirsch","new media at a16z","Inferact","Founding Designer","Design","San Francisco Bay Area","Creators of vLLM hiring a founding designer at Inferact.","2026-09-02","https://x.com/katiekirsch/status/2095224117813477867","KK","#5a7a8a","TRUE"],
 ["paidhr-software-designer","Daniel Zaheer Fransix","Head of design at PaidHR","PaidHR","Software Designer (Product Designer)","Design","Lagos","Looking to hire Software Designer / Product Designer.","2026-09-04","https://x.com/danielfransix/status/2095784261710188611","DF","#8a6a5a","TRUE"],
 ["paidhr-graphic-designer","Daniel Zaheer Fransix","Head of design at PaidHR","PaidHR","Graphic Designer / Illustrator","Design","Lagos","Graphic Designer / Illustrator; motion experience a plus.","2026-09-04","https://x.com/danielfransix/status/2095784261710188611","DF","#6a8a5a","TRUE"],
 ["paidhr-motion-designer","Daniel Zaheer Fransix","Head of design at PaidHR","PaidHR","Motion Designer / Animator","Design","Lagos","Motion designer / animator; ability to create own assets a plus.","2026-09-04","https://x.com/danielfransix/status/2095784261710188611","DF","#5a6a8a","TRUE"],
 ["micro-holdco-engineer","Dev Shah","The Micro Startup Guy","Micro HoldCo","Engineer (deal-screening stack)","Engineering","Mumbai / Remote","Own the in-house stack that screens 30-50 PE deals a week. Agents that read CIMs. Show what you've shipped.","2026-08-31","https://x.com/devlikesbizness/status/2094420533568065686","DS","#6a9a3f","TRUE"],
 ["yc-founding-engineer","Keana Alabre","Talent matchmaker for YC/VC startups","Multiple YC/VC startups","Founding Engineer","Engineering","United States (varies by company)","Connecting talent to YC and VC-backed teams. $150K-$500K+.","2026-08-31","https://x.com/Keanaalabre/status/2094479803856334930","KA","#4a8a8a","TRUE"],
 ["yc-fde","Keana Alabre","Talent matchmaker for YC/VC startups","Multiple YC/VC startups","Forward Deployed Engineer","Engineering","United States (varies by company)","FDE roles across GovTech, EdTech, Consumer, Computer Use, Frontier AI, Robotics. $150K-$500K+.","2026-08-31","https://x.com/Keanaalabre/status/2094479803856334930","KA","#8a4a8a","TRUE"],
 ["yc-applied-ai-engineer","Keana Alabre","Talent matchmaker for YC/VC startups","Multiple YC/VC startups","Applied AI Engineer","Engineering","United States (varies by company)","Applied AI engineer roles at YC/VC-backed founding teams. $150K-$500K+.","2026-08-31","https://x.com/Keanaalabre/status/2094479803856334930","KA","#4a8a5a","TRUE"],
 ["yc-account-executive","Keana Alabre","Talent matchmaker for YC/VC startups","Multiple YC/VC startups","Account Executive","Sales","United States (varies by company)","AE roles at YC and VC-backed founding teams across GovTech, EdTech, Consumer, Computer Use, Frontier AI, Physical AI, Robotics. $150K-$500K+.","2026-08-31","https://x.com/Keanaalabre/status/2094479803856334930","KA","#8a5a4a","TRUE"],
 ["yc-operator","Keana Alabre","Talent matchmaker for YC/VC startups","Multiple YC/VC startups","Operator","Operations","United States (varies by company)","Operator roles at YC and VC-backed founding teams. $150K-$500K+.","2026-08-31","https://x.com/Keanaalabre/status/2094479803856334930","KA","#5a8a8a","TRUE"],
 ["yc-data-scientist","Keana Alabre","Talent matchmaker for YC/VC startups","Multiple YC/VC startups","Data Scientist","Data","United States (varies by company)","Data Scientist roles at YC and VC-backed founding teams. $150K-$500K+.","2026-08-31","https://x.com/Keanaalabre/status/2094479803856334930","KA","#8a7a5a","TRUE"],
 ["prescience-founding-ops","Rishab Jain","Cofounder at Prescience","Prescience","Founding Operations / Head of Operations","Operations","San Francisco","Prescience also hiring founding operations / head of operations in SF.","2026-09-04","https://x.com/RishabJainK/status/2095695090274664707","RJ","#5a4a8a","TRUE"],
 ["nationgraph-account-manager","Chris","Growth staff at NationGraph","NationGraph","Account Manager","Sales","Toronto","Hiring an account manager in Toronto. DMs open.","2026-09-03","https://x.com/chrislevan24/status/2095514366187651135","CH","#3f8a9a","TRUE"],
 ["nationgraph-csm","Chris","Growth staff at NationGraph","NationGraph","Customer Success Manager","Sales","Toronto","CSMs in Toronto to sell government-data intelligence.","2026-09-03","https://x.com/chrislevan24/status/2095514366187651135","CH","#9a3f6a","TRUE"],
 ["stealth-applied-ai","Anna","Founder at AccrueTalent","Stealth AI startup","Applied AI / Product AI Engineer","Engineering","San Francisco","Long-running autonomous agents. 3-6 YOE. $250K-$500K + equity. Team from Tesla AI, PI, Anthropic, Adept, Jane Street, NVIDIA, DeepMind.","2026-09-03","https://x.com/annajmalayan/status/2095650243492921770","AN","#7a3f6a","TRUE"],
 ["stealth-research-scientist","Anna","Founder at AccrueTalent","Stealth AI startup","Research Scientist / Research Engineer","Engineering","San Francisco","LLM post-training, RL, agents, computer use, evals, multimodal. 2-6 YOE. $250K-$500K + equity. SF.","2026-09-03","https://x.com/annajmalayan/status/2095642900742959533","AN","#3f6a7a","TRUE"],
 ["paystack-senior-web-designer","Darlington Anyanwu","Global tech recruiter","Paystack","Senior Web Designer","Design","Lagos","Design in Figma and build with HTML/CSS/React. Shape Paystack public web. Hybrid Lagos.","2026-09-03","https://x.com/official_cumi/status/2095603213471023146","DA","#5a8a3f","TRUE"],
 ["yc-fde-nyc","Neil","Talent eng for YC / Series A-B","YC / Series A-B company","Forward Deployed Engineer","Engineering","New York","Still hiring FDE in NYC. Built modern agent apps, founding-engineer comfort, like talking to customers.","2026-09-03","https://x.com/neilkanakia/status/2095476966061469726","NE","#7a6a3f","TRUE"],
 ["dev-infra-growth-engineer","Camilo Vlies","Places engineers at US/Canada startups","Dev infra startup","Growth Engineer","Engineering","San Francisco / Remote","Full-stack but judged on activation and conversion. $190-265k. SF or remote Americas.","2026-09-02","https://x.com/CamiloVlies/status/2095129671360749910","CV","#3f8a9a","TRUE"],
 ["smartx-product","Kezkiuz","Web3 CM / content","SmartX","Product","Product","Singapore","SmartX hiring across product, engineering, growth and social. Shape how the next generation trades.","2026-09-04","https://x.com/0xkezkiuz/status/2095750395863998470","KE","#8a9a3f","TRUE"],
 ["smartx-engineering","Kezkiuz","Web3 CM / content","SmartX","Engineering","Engineering","Singapore","SmartX hiring engineering. Shape how the next generation trades.","2026-09-04","https://x.com/0xkezkiuz/status/2095750395863998470","KE","#3f9a5a","TRUE"],
 ["smartx-growth","Kezkiuz","Web3 CM / content","SmartX","Growth","Growth","Singapore","SmartX hiring growth. Shape how the next generation trades.","2026-09-04","https://x.com/0xkezkiuz/status/2095750395863998470","KE","#5a9a3f","TRUE"],
 ["smartx-social","Kezkiuz","Web3 CM / content","SmartX","Social","Growth","Singapore","SmartX hiring social. Shape how the next generation trades.","2026-09-04","https://x.com/0xkezkiuz/status/2095750395863998470","KE","#9a3f5a","TRUE"],
 ["dream-growth","Arun Philips","ex CMO at Polygon; building DreamStarter","DreamStarter","Growth Intern","Growth","Remote (IST)","Paid 3-month intern. Run AI marketing agents on real accounts, research the weekly AI Marketing Brief, follow up with warm leads and talk to prospects.","2026-09-04","https://x.com/arunphilips/status/2095821968851484739","AP","#4a8a3f","TRUE"],
 ["dream-eng","Arun Philips","ex CMO at Polygon; building DreamStarter","DreamStarter","AI Engineering Intern","Engineering","Remote (IST)","Paid 3-month intern. TypeScript stack, build and harden agent workflows, review AI-written code, own the mobile test pass.","2026-09-04","https://x.com/arunphilips/status/2095821968851484739","AP","#3f8a9a","TRUE"],
 ["tk-eng","tk","Building in AI / crypto","","AI + Crypto Engineer (agent harnesses)","Engineering","","Looking for someone good with AI, agent harnesses, and tuned-in crypto dev. Pay + equity split. DM with proof of work.","2026-09-04","https://x.com/heettike/status/2095826433016996332","TK","#3f7a6a","TRUE"],
 ["steve-eng","Steve Flanders","Financial alchemist at Lattica","Lattica","Full Stack Engineer","Engineering","Remote / Philadelphia","Full stack engineer, $150-220k + 0-0.5% equity. High autonomy. Apply at lattica.finance/careers.","2026-09-02","https://x.com/SteveFlanders22/status/2095265251218300959","SF","#8a9a3f","TRUE"],
 ["steve-prod","Steve Flanders","Financial alchemist at Lattica","Lattica","Product Designer","Design","Remote / Philadelphia","Product designer, $80-120k + 0-0.5% equity. High autonomy. Apply at lattica.finance/careers.","2026-09-02","https://x.com/SteveFlanders22/status/2095265251218300959","SF","#9a3f8a","TRUE"],
]

HEADER = ["id","person_name","person_headline","company","role","category","location","excerpt","published_at","source_url","initials","accent","active"]

# Read appended jobs from new-jobs.csv
rows = list(csv.reader(open('scripts/google-sheets/new-jobs.csv')))
appends = [r for r in rows[1:] if r and r[0].strip()]

all_rows = [r[:13]+(["TRUE"] if len(r)<13 or not r[12] else [r[12]]) for r in block1]

# merge appends, keeping first occurrence per id
seen = {}
for r in all_rows:
    seen.setdefault(r[0], r)
for r in appends:
    if len(r) < 12:
        continue
    r = r[:12] + (["TRUE"] if len(r) < 13 or not r[12] else [r[12]])
    if r[0] not in seen:
        seen[r[0]] = r
        all_rows.append(r)

# detect any duplicate ids that slipped through
from collections import Counter
c = Counter(r[0] for r in all_rows)
dupes = {k:v for k,v in c.items() if v>1}
print("total rows after merge:", len(all_rows))
print("dup ids:", dupes or "none")

# flag aggregators / spam
AGG = {
 "yc-founding-engineer": "Talent matchmaker (YC/VC portal)",
 "yc-fde": "Talent matchmaker (YC/VC portal)",
 "yc-applied-ai-engineer": "Talent matchmaker (YC/VC portal)",
 "yc-account-executive": "Talent matchmaker (YC/VC portal)",
 "yc-operator": "Talent matchmaker (YC/VC portal)",
 "yc-data-scientist": "Talent matchmaker (YC/VC portal)",
 "yc-fde-nyc": "Talent eng aggregator",
 "seed-stage-fde": "Talent eng aggregator",
 "openai-founding-fde": "Recruiter-sourced (a16z talent)",
 "waymo-head-of-logistics": "Recruiter-sourced (a16z talent)",
 "ideogram-first-marketer": "Recruiter-sourced (a16z talent)",
 "inferact-founding-designer": "Recruiter-sourced (a16z talent)",
 "ava-labs-fde": "Recruiter-posted (Ava Labs recruiter)",
 "ava-labs-staff-avalanchego": "Recruiter-posted (Ava Labs recruiter)",
 "ava-labs-em-fortary": "Recruiter-posted (Ava Labs recruiter)",
 "ava-labs-pm-fortary": "Recruiter-posted (Ava Labs recruiter)",
 "dev-infra-growth-engineer": "Recruiter/agency (no named company)",
 "paystack-senior-web-designer": "Posted by external recruiter",
 "dtc-ops-head": "Vague company, recruiter-style",
 "dusan-yt-editor": "Freelance/independent (no company)",
 "ltvjack-creative-strat": "Freelance/independent (no company)",
 "dorg-outbound-sales": "Co-op/DAO post",
}
SPAM = {
 "stealth-applied-ai": "STEALTH + recruiter + $250-500k promise",
 "stealth-research-scientist": "STEALTH + recruiter + $250-500k promise",
 "tk-eng": "No company, no location, vague pay split",
}

print("\n--- flagged aggregator / spam entries ---")
for r in all_rows:
    flag = AGG.get(r[0]) or SPAM.get(r[0])
    if flag:
        print(f"  [{r[0]}]  {r[3]} | {r[4]}  -> {flag}")

# write cleaned output
with open('scripts/google-sheets/cleaned-jobs.csv','w',newline='') as f:
    w = csv.writer(f)
    w.writerow(HEADER)
    for r in all_rows:
        w.writerow(r[:13])
print("\nwrote cleaned-jobs.csv with", len(all_rows), "rows")