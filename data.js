// ===== Editable app name =====
window.APP_NAME = "Sled Finder";   // name chosen by Jonathan, 18 Nov 2026
window.APP_SHORT = "Sled Finder";

// ===== 61 American sled makers =====
// Source: "List of American Sled Manufacturers (1850-1990)" matrix (American_Sled_Manufacturers_Matrix.pdf),
// Jonathan Spangler / Rosebud Sled Museum. "book: true" = listed in Joan Palicia's books (black entries);
// "book: false" = Jonathan's own finds (green entries). Fields are copied as written in the matrix; blanks stay blank.
// [n, name, sled type, years, models/brands, production area, inBooks]
window.MAKERS_RAW = [
[1,"Flexible Flyer – Planet Jr / Allen Co","Runner","1880s–1970s","Numerous","Philadelphia, PA; Medina, OH",true],
[2,"Fire Fly / Yankee Clipper – Planet Jr","Runner","1900s–1970s","Numerous","Philadelphia, PA; Medina, OH",true],
[3,"Paris","Runner and iron bar","","Paris Racer, Yankee Flyer, Speedster","Paris, ME",true],
[4,"Standard Novelty Works","Runner","1900s–1980","Lightning Guider, Master Bomber, Challenger, King of the Hill","Duncannon, PA",true],
[5,"American Acme Company","Runner","1927–1960s","Skyplane, Flexoplane, Iceplane, Monoplane","Emigsville, PA",true],
[6,"Buffalo Sled Co. / Auto Wheel Coaster Co.","Runner","1899–1964","Fleetwing line of sleds and bobs","North Tonawanda, NY",true],
[7,"Garton Toy Company","Runner","1900–1970s","Penguin, Steamliner, Silver Streak, Trailbreaker","Sheboygan, WI",true],
[8,"Pratt Mfg Co.","Runner","1870s–1952","Flyaway, Red Rocket, Chieftain","Coldwater, MI",true],
[9,"Chicago Roller Skate Co","Runner & summer sled wheels","~1940s","Steer Sled","Chicago, IL",true],
[10,"Turner and Thomas","One-piece runner","1909","Steel Flyer","Chicago, IL",true],
[11,"Kalamazoo Sled Company","Runner","","Possibly Flying Arrow, Speed Demon, Fleet Arrow","Kalamazoo, MI",true],
[12,"The American National Company","Runner","1920–1940","Viking, American Ace, Pioneer, Skippy Sno Plane, Skippy Racer","Toledo, OH",true],
[13,"Richards & Wilcox","Bar runner, folding","1903–1915","Flex-o-fold, Little Giant","Aurora, IL",true],
[14,"CJ Johnson Co Safety Sled","Runner","1911–1941","Streamline Klipper, Safety Sled, Victor Easy Guider, Race-o'-plane","Mount Jewett & Bradford, PA",true],
[15,"Maplewood Craft Industries","Single ski sled","1954–1962","Steermaster Bob-ski","Maplewood, MN",true],
[16,"Wagner","Runner","1900–1930","Wagner","Cedar Falls, IA",true],
[17,"Hunt, Helm, Ferris & Co. (Starline)","Steel sleds, Skeeboggan, Skee-Bob","1920s","Star, Cannon Ball, Skeeboggan","Harvard, IL",true],
[18,"Duralite","Aluminum runner","1930s","Duralite Racer","Passaic, NY",true],
[19,"“Snow Hawk” (distributed by American Gold Co.)","Ski sled","1917","Snow Hawk","Unknown, possibly Boston, MA",true],
[20,"Crosby Gilzinger Co","Iron bar runner","1877–1904","Ulster","Rondout, NY",true],
[21,"Ellingwood Turning Company","Metal bar runner","1913–1920","Oxford Sled","West Paris, ME",true],
[22,"Withington","","","","",true],
[23,"Wilkinson","","","","",true],
[24,"Maynard Miller","Cutters and clippers","","","Seneca Falls, NY",true],
[25,"Helund","Runner","1940s/50s","American","Nokomis, IL",false],
[26,"Turco / Mattel","Bobsleds","1940s/50s","Snoobee, Sno Bronco","St. Louis, MO",false],
[27,"Strand","Runner","1920s","","Menomonee, WI",false],
[28,"Clark Auto Equipment Co","Pressed steel (three tubular runners)","1940","Sno-Rocket","Columbus, OH",false],
[29,"“Snow Rocket” Sled","Bar runner, heavy","~1948","","Unknown",false],
[30,"Thompson Corporation","Runner","~1950s–60s","Thompson, American","Brownstown, IN",false],
[31,"Firms Inc","Heavy bar runner","~1940–50","Flying Arrow","Detroit, MI",false],
[32,"Quasi Manufacturing Co.","Runner","~1947","Sled Master","Chicago, IL",false],
[33,"Viking Corp / Fliteaway","Ski sled (four)","~1960s–70s","Atomic Rocket, Fliteaway","Stoughton, WI",false],
[34,"Sheboygan Wagon Works","Runner","~1900–1920","Dodger, Scout Racer and Milwaukee","Sheboygan, WI",false],
[35,"Mirro","Flat runner with seat","–1958","Sno Bronco","Manitowoc, WI",false],
[36,"Folbot","Aluminum runner","–1980–88","Brookstone, Folbot","Charleston, SC",false],
[37,"Ski Sled Corporation","Ski sled (two)","1960s–70s","Slalom 400","Chicago, IL",false],
[38,"Sheffield Manufacturing Company","Runner","1910–1915","","Burr Oak, MI",false],
[39,"Seymour Manufacturing Co.","Runner","–1950","Flying Cloud","Seymour, IN",false],
[40,"W.P. Pritchard Co","Single ski sled","1915–30s","Jack Jumper Ski","Adams, MA",false],
[41,"Woodstock Manufacturing Co","Ski sled or ski-bob (two)","1920s–30s","“Ski-bob”","Rochester, NY",false],
[42,"Winner Boat Company","Tri-runner sled","1930s–40s","Winner Racer","Trenton, NJ",false],
[43,"Peerless","Cutter, single wrapped/folded runner","","","???, IL",false],
[44,"Monoblade (possibly American Acme)","Mono runner","","","?",false],
[45,"Winner Ice Cycle","Tri-runner","","","?",false],
[46,"Crandell Toy","Cutter","1860–1870","Horse & Swan?","NYC",false],
[47,"True Temper","Runner","1960","Snow Hawk","Harrisburg, PA",false],
[48,"Snow Clipper (possibly Deposit Co.)","Scooter, 3 runner","","","?",false],
[49,"Chicago Wire Chair","Folding sled","","","Chicago, IL",false],
[50,"Ice Surfer","Ski board","","","Libertyville, IL",false],
[51,"Flying Bob","Bob, round steering bar","","","?",false],
[52,"Tubular Steel Sled Co.","Cutter","1900","Known only from an advert","Montrose, PA",false],
[53,"Ney Mfg","Cutter","","Unknown","Canton, OH",false],
[54,"Barry Toycraft","Ski bob sled","","Snow King Olympic Bobsled","St Paul, MN",false],
[55,"Thrill Coaster","Airplane","","Mfg unknown","Possibly NJ",false],
[56,"Gendron Wheel Co","Runner","","Pioneer","Toledo, OH",false],
[57,"Deposit Mfg Co.","Cutter","","","Deposit, NY",false],
[58,"Wabash","Steel “hand sleds”; cutter, clipper","","","Wabash, IN",false],
[59,"Martin & Heagy Mfg Company","Unknown","1915","“Hickory Coaster” (no image; known only through a list of manufacturers)","Elizabethtown, PA",false],
[60,"Bent Run Ladder Mfg Co.","Steerable runner?","1915","Known only from an advert","Indiana, PA",false],
[61,"Rumsey Mfg Co.","Tubular steel","1886?–1898","Youth's Companion","Detroit, MI",false]
];

// ===== Free maker profiles (10) and premium briefs =====
// Text condensed from "America's Antique Sleds and the Companies That Made Them" (Rosebud Sled Museum company briefs,
// Nov 12 2026 print edition), which cites its sources and confidence ratings. Nothing here is new research.
window.PROFILES = {
1:{head:"S. L. Allen & Co. · Philadelphia, Pennsylvania · sleds 1889–1968 (brand continues)", conf:"High",
 img:"images/flexible-flyer-3c-p60.jpg", cap:"Flexible Flyer No. 3C, c. 1915–1920. Rosebud Sled Museum collection.",
 ad:"images/ad-flexible-flyer-hardware-1894.jpg", adcap:"“A Sled that Steers / A Sled that Sells.” Hardware, 10 Oct 1894. Public domain.",
 text:["Samuel Leeds Allen's S. L. Allen & Co., incorporated in 1871 to make farm and garden equipment, received U.S. Patent 408,681 on August 13, 1889, for the Flexible Flyer: a wooden crossbar flexed the spring-steel runners so the rider could steer.",
 "Sales were slow until the sled went into department-store toy departments; about 120,000 were sold in 1915. The Tuxedo Racer topped the line from 1908, and the five-millionth sled came in 1939.",
 "Leisure Group bought S. L. Allen in 1968 and moved production to Medina, Ohio. Later owners included Blazon-Flexible Flyer and Roadmaster (Olney, Illinois, 1993). Since 2005 the trademark has belonged to Paricon of South Paris, Maine."]},
3:{head:"Paris Manufacturing Co. · South Paris, Maine · 1861–1989", conf:"High",
 img:"images/paris-speedster-deck-p53.jpg", cap:"Speedster, Paris Mfg. Co., c. 1920–1930. Rosebud Sled Museum collection.",
 text:["Henry Franklin Morton and his wife, Lucilla Forbes, started the business in 1861 in Sumner, Maine, later moving to Paris Hill and then South Paris. By the early 1900s Paris employed hundreds of workers making sleds and toboggans, and later furniture and skis.",
 "The collector's books say its first steering sled, the Speedway, came in 1912, the same year it switched from wood to metal runners. Rosebud examples include the Speedster and the Dirigo Clipper.",
 "Gladding bought Paris in 1970 and sold the business in 1978. The company closed in 1989. Hank Morton founded the successor, Paricon, in 1991."]},
4:{head:"Standard Novelty Works · Duncannon, Pennsylvania · 1904–1990", conf:"High",
 img:"images/ad-standard-novelty-works-hardware-age-1917.jpg", cap:"Lightning Guider ad, Hardware Age, 20 Jan 1917. Public domain.",
 text:["William Wills and P. F. Duncan founded Standard Novelty Works in 1904 at Duncannon, on the Susquehanna River. Its signature product was the Lightning Guider steering sled, made from 1904 to 1988.",
 "In 1920 the plant was credited with producing more children's sleds than any other U.S. factory, at 1,600 to 1,800 a day.",
 "The factory officially closed in October 1990; in 1992 it became a State Historical Site, and the building now houses the Old Sled Works market."]},
5:{head:"American Acme Co. · York and Emigsville, Pennsylvania · sleds 1917–early 1960s", conf:"High",
 img:"images/american-acme-iceplane-owner.jpg", cap:"American Acme Iceplane. Rosebud Sled Museum collection.",
 text:["Casper Oermann opened American Toy and Novelty Works in York in 1917, making cider mills, berry presses and boys' sleds. In 1927 it merged with Acme Wagon Works of Emigsville to form American Acme Co., and a newspaper that year reported sales of more than 150,000 sleds.",
 "Model names included the Iceplane, Royal Plane, Sky Plane, Rocket Plane, Monoplane and Speedplane.",
 "A fire on April 1, 1950, did $600,000 in damage. In the early 1960s, after a rival underbid it on a big order and plastic saucers ate into sales, the company left the sled business."]},
6:{head:"Auto-Wheel Coaster Co. (Buffalo Sled Co.) · North Tonawanda, New York · 1899–1964", conf:"High",
 img:"images/ad-auto-wheel-fleetwing-p19.jpg", cap:"Fleetwing steering sleds and racers, Auto-Wheel Coaster Co. catalog p. 19 (year not printed). Rosebud Sled Museum collection.",
 ad:"images/ad-auto-wheel-coaster-toys-novelties-1920.jpg", adcap:"Auto-Wheel Coaster Co. ad, Toys and Novelties, Aug 1920. Public domain.",
 text:["Buffalo Sled Company started around 1899 in Buffalo, New York (some sources say 1889), and was organized around 1905 by John J. Schneider and Henry J. Tiedt (one source says John Snyder). In 1909 it bought the Orient Novelty Company of North Tonawanda and moved into that firm’s three-story factory at the foot of Schenck Street, where it made sleds (including the Gliderole) and snow shovels, adding coaster wagons in 1912.",
 "A fire on April 16, 1920, destroyed the wheel department and storehouses; the company rebuilt and, in July 1920, filed incorporation papers in Albany renaming itself the Auto-Wheel Coaster Company, formerly the Buffalo Sled Company, because coaster wagons had become the principal product and the sled side had deteriorated. The Buffalo office closed after the filing, though the Buffalo Sled name still appeared on products into the early 1920s as back inventory.",
 "It also operated at times on Ellicott Creek in Buffalo in the old A. B. Williams plant, in Preston, Ontario, and through a branch in Terre Haute, Indiana. At its peak the firm employed about 160 people, advertised heavily in Popular Mechanics, and from 1915 organized Auto-Wheel Coaster Clubs across the United States to “develop leadership in boys.”",
 "Principal products included the Auto Wheel Coaster Wagon, Fleetwing Steering Sled, Coaster King, Fleetwing, and Fleetwing Racer, along with scooters, pedal bikes, sled strollers, bobsleds, and snow shovels, marketed as “Health Builders for Children.”",
 "Auto-Wheel filed for bankruptcy in July 1964, with union strikes and competition blamed; Wheel Industries bought the company in September 1964 to resume production, but the effort was not successful. The old plant, then being converted to a pallet factory, was destroyed by fire on Memorial Day, May 29, 1972 (some sources say May 31), a blaze that also took at least seven nearby homes."]},
7:{head:"Garton Toy Company · Sheboygan, Wisconsin · 1879–1973 (book: 1889–1975)", conf:"High (company) / Medium (sled models)",
 img:"images/garton-dragon-head-sleigh-p52.jpg", cap:"Dragon Head Sleigh, c. 1902–1913. Rosebud Sled Museum collection.",
 ad:"images/ad-garton-catalog-7541.jpg", adcap:"Garton catalog page (per Jonathan Spangler): sled nos. 7541, 7547 and 7553 at 42, 47 and 53 in. Year not shown; the page header is cut off. Supplied by Jonathan Spangler.",
 text:["Eusebius Bassingdale Garton started the business in Sheboygan; local sources say 1879, a collector's book says 1889. At first he made cigar boxes, washboards and fish boxes.",
 "Garton went on to make sleds, wagons, tricycles, scooters and pedal cars. The collector's book says its first steerable sleds, the Eskimo and the Dreadnaught, came in 1916.",
 "Four generations of Gartons ran the firm before the family sold it in 1973."]},
8:{head:"Pratt Manufacturing Co. · Coldwater, Michigan · 1882–1952", conf:"High",
 img:"images/pratt-chieftain-red-rocket-p55.jpg", cap:"“Chieftain” Red Rocket, c. 1940–1952. Rosebud Sled Museum collection.",
 ad:"images/ad-pratt-flyaway.jpg", adcap:"“Steering Coasters, The New FLY-AWAY Line.” Pratt Mfg. Co., Coldwater, Mich. (year not printed). Supplied by Jonathan Spangler.",
 text:["Pratt & Chase was organized in 1882 in Coldwater by Wellington Chase and J. F. Pratt, making horse-drawn cutters and children's sleds from the cutter scraps. After Chase died in 1890 the firm became The Pratt Manufacturing Company.",
 "Known sleds include the Flyaway steering sled and the “Chieftain” Red Rocket. During World War II the plant made only cots for the armed services.",
 "Production ceased in 1952, and the assets went to auction that November."]},
11:{head:"Kalamazoo Sled Company · Kalamazoo, Michigan · 1894–1972", conf:"High",
 img:"images/kalamazoo-speed-demon-p58.jpg", cap:"Speed Demon, c. 1938. Rosebud Sled Museum collection.",
 ad:"images/ad-kalamazoo-dealer.jpg", adcap:"Kalamazoo Sled Co. dealer ad (year not printed). Photo supplied by Jonathan Spangler.",
 text:["The firm began as the Page Manufacturing Co., a maker of wooden buggy parts, and was reorganized as the Kalamazoo Sled Company on February 14, 1894.",
 "Its Champion line included low racers, high-sided girls' sleds and a baby sled; in 1956 it launched the Champion Flying Disc saucer.",
 "It became Kalamazoo Sled and Toys in 1962. Gladding Corp. bought the company in 1968, and operations moved to Maine in 1972."]},
16:{head:"Wagner Manufacturing Co. · Cedar Falls, Iowa · sleds c. 1904–1923", conf:"Medium",
 img:"images/wagner-winner-pair-p61.jpg", cap:"Wagner Winner sleds, c. 1911–1919. Rosebud Sled Museum collection.",
 text:["Adam Wagner opened a one-room shop in 1902 and incorporated in 1904. Wagner received a patent for a steel hand sled on June 28, 1904, and the wood-decked Winner became its signature sled.",
 "The latest Wagner sled ads found date from 1923, after which the company went on to elevator-door and garage-door hardware.",
 "Most of these facts come from one source, the Vintage Runner Magazine article."]},
17:{head:"Hunt, Helm, Ferris & Co. (Starline) · Harvard, Illinois · founded 1883; sleds documented 1920s", conf:"High (company) / Medium (sled models)",
 img:"images/ad-hunt-helm-ferris-hardware-age-1925.jpg", cap:"“Cannon Ball Beats ’Em All.” Hardware Age, 8 Oct 1925. Public domain.",
 text:["Henry L. Ferris patented a hay carrier in 1883, backed by Harvard hardware merchants Charles E. Hunt and Nathan B. Helm. It made barn equipment in its “Star” line and, under the Cannon Ball division, children's vehicles.",
 "Documented sleds include the Star steel sled, the Cannon Ball Skee-Bob, and the Skeeboggan, patented by Howard J. Ferris in 1926.",
 "The firm was renamed Starline in 1931; sources disagree on when the plant closed."]},
// ---- Premium makers that already have a written brief ----
10:{head:"Turner & Thomas · Chicago, Illinois · Steel Flyer documented by Dec 1909", conf:"High / Medium",
 text:["A December 5, 1909, letter on company letterhead offered the Steel Flyer to Wooster Hardware Co., and Samuel J. Turner of Chicago received U.S. Patent 978,515 on December 13, 1910, for a sled stamped from sheet metal.",
 "A full company history is still lacking, and no closing date has been found."]},
13:{head:"Richards & Wilcox · Aurora, Illinois · sleds c. 1908–c. 1915/16", conf:"High",
 ad:"images/ad-richards-wilcox-1914-p218.jpg", adcap:"No. 600 Little Giant Folding Sled, Richards-Wilcox Catalog No. 12, 1914. Public domain.",
 text:["A hardware maker, later Richards-Wilcox, that also sold folding and steering sleds, including the No. 600 Little Giant and the Flex-O-Fold.",
 "In a 1919 letter the company said it had discontinued sled production about 1915–1916."]},
23:{head:"Wilkinson Manufacturing Co. · Binghamton, New York · from April 1890", conf:"High / Medium",
 ad:"images/ad-wilkinson-1920.jpg", adcap:"Wilkinson Mfg. Co. ad, The Valley of Opportunity, 1920. Public domain.",
 text:["Succeeded the Winton Manufacturing Co. in April 1890. Storm King sleds appear in its 1917 catalog; the collector's book says the company went out of business in the 1930s.",
 "[Note: the matrix lists only the name “Wilkinson”; this identification follows the company briefs.]"]},
32:{head:"Quasi Mfg. Co. · Chicago, Illinois · c. 1947", conf:"High (maker) / Medium (date)",
 img:"images/quasi-sled-master-chicago-p54.jpg", cap:"Sled Master, c. 1947. Rosebud Sled Museum collection.",
 text:["Made the Sled Master, a steerable metal-runner sled. Jonathan says the company was in business only one, maybe two years, and that the Sled Master was mostly advertised in 1947."]},
37:{head:"Ski Sled Corporation · Chicago, Illinois · patented 1965–67; sold in the 1970s", conf:"High",
 ad:"images/ad-ski-sled-model-400.jpg", adcap:"Ski Sled Model 400 instructions. Rosebud Sled Museum collection.",
 text:["A subsidiary of Radio Steel & Mfg. Co. (today's Radio Flyer). The rider sat above two parallel skis, leaned to tilt them on edge, and used a hand brake."]}
};

// ===== Sample collector data (EXAMPLE DATA – not real users) =====
// Each entry is one record: one user, one location, one or more photos (imgs[0] = cover).
// "years" = Estimated years of manufacture. Dates come only from the briefs/Rosebud captions (s1, s3, s4, s5, s6, s7, s8)
// or the matrix's production dates for one-model, short-lived makers (s10 Sled Master ~1947; s11 Firms Inc ~1940–50). Everything else is "Unknown".
window.SAMPLE_SLEDS = [
 {id:"s1", sledType:"Runner", locType:"found", town:"Schaumburg, IL", lat:42.03, lng:-88.08, user:"sample_collector", maker:1, model:"No. 3C", years:"c. 1915–1920", size:"[sample]", condition:"Good", found:"[sample] Estate sale, Illinois", notes:"Example entry using a Rosebud Sled Museum photo.", shared:true, imgs:["images/flexible-flyer-3c-p60.jpg","images/flexible-flyer-3c-b.jpg","images/hero-flexible-flyer-3c-deck-p60.jpg"], likes:24, mine:true},
 {id:"s2", sledType:"Runner", locType:"now", town:"Elgin, IL", lat:42.04, lng:-88.28, user:"sample_collector", maker:3, model:"Dirigo Clipper", years:"Unknown", size:"[sample]", condition:"Fair", found:"[sample] Antique mall", notes:"Example entry.", shared:true, imgs:["images/paris-dirigo-clipper-p56.jpg","images/paris-dirigo-clipper-deck-p56.jpg"], likes:17, mine:true},
 {id:"s3", sledType:"Runner", locType:"now", town:"Schaumburg, IL", lat:42.03, lng:-88.08, user:"sample_collector", maker:32, model:"Sled Master", years:"c. 1947", size:"[sample]", condition:"Very good", found:"[sample] Flea market", notes:"Example entry.", shared:true, img:"images/quasi-sled-master-chicago-p54.jpg", likes:6, mine:true},
 {id:"s4", locType:"found", town:"Sheboygan, WI", lat:43.75, lng:-87.71, user:"sample_collector", maker:7, model:"Dragon Head Sleigh", years:"c. 1902–1913", size:"[sample]", condition:"Good", found:"[sample] Auction", notes:"Example entry.", shared:true, imgs:["images/garton-dragon-head-sleigh-p52.jpg","images/garton-dragon-head-b.jpg","images/garton-dragon-head-c.jpg","images/garton-indian-chief-stencil-p52.jpg"], likes:31, mine:true},
 {id:"s5", sledType:"Runner", locType:"found", town:"Bradford, PA", lat:41.96, lng:-78.64, user:"example_runner_fan", maker:14, model:"Streamline Klipper", years:"c. 1939–1941", size:"[sample]", condition:"Good", found:"[sample] Barn find", notes:"Example entry.", shared:true, img:"images/johnson-streamline-klipper-p57.jpg", likes:12},
 {id:"s6", sledType:"Runner", locType:"now", town:"Kalamazoo, MI", lat:42.29, lng:-85.59, user:"demo_flyer_hunter", maker:11, model:"Speed Demon", years:"c. 1938", size:"[sample]", condition:"Restored", found:"[sample] Garage sale", notes:"Example entry.", shared:true, imgs:["images/kalamazoo-speed-demon-p58.jpg","images/kalamazoo-speed-demon-b.jpg","images/kalamazoo-speed-demon-c.jpg"], likes:9},
 {id:"s7", sledType:"Runner", locType:"found", town:"Coldwater, MI", lat:41.94, lng:-85.0, user:"example_runner_fan", maker:8, model:"Red Rocket", years:"c. 1940–1952", size:"[sample]", condition:"Fair", found:"[sample] Online listing", notes:"Example entry.", shared:true, imgs:["images/pratt-chieftain-red-rocket-p55.jpg","images/pratt-red-rocket-b.jpg"], likes:15},
 {id:"s8", sledType:"Runner", locType:"now", town:"Cedar Falls, IA", lat:42.53, lng:-92.45, user:"demo_flyer_hunter", maker:16, model:"Winner (pair)", years:"c. 1911–1919", size:"[sample]", condition:"Good", found:"[sample] Estate sale", notes:"Example entry.", shared:true, img:"images/wagner-winner-pair-p61.jpg", likes:20},
 {id:"s10", sledType:"Runner", locType:"now", town:"Naperville, IL", lat:41.75, lng:-88.15, user:"demo_flyer_hunter", maker:32, model:"Sled Master", years:"c. 1947", size:"[sample]", condition:"Fair", found:"[sample] Flea market", notes:"Example entry.", shared:true, img:"images/quasi-sled-master-chicago-p54.jpg", likes:8},
 {id:"s11", sledType:"Runner", locType:"found", town:"Detroit, MI", lat:42.33, lng:-83.05, user:"example_new_collector", maker:31, model:"Flying Arrow", years:"c. 1940–1950", size:"[sample]", condition:"Good", found:"[sample] Garage sale", notes:"Example entry. [sample] maker attribution for demo only.", shared:true, img:"images/collection-flying-arrow-photos-p32.jpg", likes:5},
 {id:"s12", sledType:"Runner", locType:"found", town:"Coldwater, MI", lat:41.94, lng:-85.00, user:"example_new_collector", maker:8, model:"Red Rocket", years:"Unknown", size:"[sample]", condition:"Fair", found:"[sample] Barn find", notes:"Example duplicate entry: same maker + model, different collector and town.", shared:true, imgs:["images/pratt-red-rocket-b.jpg"], likes:4},
 {id:"s13", sledType:"Runner", locType:"now", town:"Schaumburg, IL", lat:42.03, lng:-88.08, user:"sample_collector", maker:8, model:"Red Rocket", years:"Unknown", size:"[sample]", condition:"Good", found:"[sample] Antique mall", notes:"Example entry using a photo supplied by Jonathan Spangler.", shared:true, imgs:["images/pratt-red-rocket-jonathan.jpg"], likes:10, mine:true},
  {id:"s14", locType:"found", town:"Elgin, IL", lat:42.04, lng:-88.28, user:"example_new_collector", maker:0, makerText:"Likely Pratt or Kalamazoo", model:"Unknown", years:"Unknown", size:"[sample]", condition:"Fair", found:"[sample] Garage sale", notes:"Example entry with a custom, unconfirmed maker. Sled Finder (admin) can reassign it later.", shared:true, img:"images/collection-pictorial-deck-photos-p31.jpg", likes:2},
 {id:"s9", sledType:"Runner", locType:"found", town:"York, PA", lat:39.96, lng:-76.73, user:"sample_collector", maker:5, model:"Iceplane", years:"Unknown", size:"[sample]", condition:"Good", found:"[sample] Auction", notes:"Example entry.", shared:true, img:"images/american-acme-iceplane-owner.jpg", likes:11, mine:true},
 {id:"s15", sledType:"Flexy Racer", locType:"now", town:"Schaumburg, IL", lat:42.03, lng:-88.08, user:"sample_collector", maker:1, model:"Flexy Racer 200", years:"Unknown", size:"[sample]", condition:"Good", found:"[sample] Collection", notes:"Example entry for a Flexy Racer, using a photo supplied by Jonathan Spangler.", shared:true, imgs:["images/ff-flexy-racer-200.jpg"], likes:7, mine:true},
];
window.ID_POSTS = [
 {id:"q1", user:"example_new_collector", img:"images/collection-flying-arrow-photos-p32.jpg", q:"[sample] Found this at a garage sale – deck says Flying Arrow. Who made it?", answers:["[sample] The matrix lists Flying Arrow under Firms Inc (Detroit) and possibly Kalamazoo – check the runner stamp."]},
 {id:"q2", user:"demo_flyer_hunter", img:"images/collection-pictorial-deck-photos-p31.jpg", q:"[sample] Painted pictorial deck, no markings. Any ideas?", answers:[]},
 {id:"q3", user:"example_runner_fan", img:"images/collection-red-swirl-deck-photos-p28.jpg", q:"[sample] Red swirl deck on steel runners – maker?", answers:[]}
];

// ===== Free makers (7; confirmed by Jonathan 18 Nov 2026) =====
// Matrix row -> display label. Everyone else (55) is Premium.
// "Lightning Guider" = Standard Novelty Works (matrix #4), confirmed by Jonathan. Paris Mfg. Co. (#3) is also free.

// ===== Community photo posts (EXAMPLE DATA) =====
// Members post one or more photos with a caption; others can comment (text and/or photos).
window.SAMPLE_PHOTO_POSTS = [
 {id:"pp1", user:"sample_collector", caption:"[sample] A Flexy Racer 200 in the collection. Example community photo post.", imgs:["images/ff-flexy-racer-200.jpg"], mine:true, created:Date.UTC(2026,10,10)},
 {id:"pp2", user:"example_runner_fan", caption:"[sample] Streamline Klipper deck, shared for the community gallery. Example post.", imgs:["images/johnson-streamline-klipper-p57.jpg"], created:Date.UTC(2026,10,12)},
 {id:"pp3", user:"demo_flyer_hunter", caption:"[sample] Speed Demon details. Example post.", imgs:["images/kalamazoo-speed-demon-p58.jpg","images/kalamazoo-speed-demon-b.jpg"], created:Date.UTC(2026,10,14)}
];
window.SAMPLE_COMMENTS = [
 {id:"cmt1", user:"example_runner_fan", targetType:"photo_post", targetId:"pp1", body:"[sample] Nice Flexy Racer — thanks for sharing.", imgs:[], created:Date.UTC(2026,10,11)},
 {id:"cmt2", user:"sample_collector", targetType:"photo_post", targetId:"pp2", body:"[sample] The stencil is still sharp in this light.", imgs:[], mine:true, created:Date.UTC(2026,10,13)},
 {id:"cmt3", user:"demo_flyer_hunter", targetType:"sled", targetId:"s15", body:"[sample] Example comment on the Flexy Racer sled post.", imgs:[], created:Date.UTC(2026,10,15)}
];

// ===== Notifications (EXAMPLE DATA, demo mode only) =====
// Live mode hides these unless SHOW_SAMPLE_DATA is true. Each row is tagged as an example.
window.SAMPLE_NOTIFICATIONS = [
 {id:"n1", kind:"sled", title:"New shared sled", body:"@example_runner_fan shared a Streamline Klipper (Runner)", href:"#/sled/s5", example:true, created:Date.now()-2*3600000},
 {id:"n2", kind:"article", title:"New exclusive article", body:"Coming soon: online-only article 1", href:"#/exclusive/placeholder-1", example:true, created:Date.now()-5*3600000},
 {id:"n3", kind:"photo", title:"New community photo", body:"@example_runner_fan posted a photo", href:"#/photopost/pp2", example:true, created:Date.now()-26*3600000},
 {id:"n4", kind:"listing", title:"New sled for sale", body:"[sample] Flexible Flyer with eagle deck · $185", href:"#/listing/l1", example:true, created:Date.now()-30*3600000}
];

window.FREE_MAKERS = {
  1:"Flexible Flyer (S. L. Allen & Co.)",
  4:"Lightning Guider (Standard Novelty Works)",
  3:"Paris Mfg. Co.",
  6:"Auto Coaster (Buffalo Sled Co. / Auto-Wheel Coaster Co.)",
  7:"Garton Toy Company",
  8:"Pratt Mfg. Co.",
  11:"Kalamazoo Sled Company"
};
window.FREE_GALLERY_COUNT = 5;   // models a free user sees per free maker

// ===== Model galleries =====
// Real model names come from the matrix or the company briefs. img:null = no photo on file yet.
// Entries marked sample:true are placeholders, not real models.
window.MODELS = {
 1:[{n:"Racer (1st generation)",d:"Per Jonathan Spangler · “Flexible Flyer Racer” stencil · photos supplied by Jonathan",imgs:["images/ff-racer-1stgen.jpg","images/ff-racer-1stgen-stencil.jpg"]},
    {n:"Flexy Racer 200",d:"Wheeled Flexy coaster, made by Flexible Flyer per Jonathan Spangler · photo supplied by Jonathan",img:"images/ff-flexy-racer-200.jpg"},
    {n:"No. 1",d:"Per Jonathan Spangler · eagle decal · photo supplied by Jonathan",img:"images/ff-no1.jpg"},
    {n:"No. 3C",d:"c. 1915–1920 · Rosebud collection (3 photos)",imgs:["images/flexible-flyer-3c-p60.jpg","images/flexible-flyer-3c-b.jpg","images/hero-flexible-flyer-3c-deck-p60.jpg"]},
    {n:"Tuxedo Racer",d:"Top of the line from 1908 (briefs) · sled photo needed",img:null},
    {n:"Tuxedo Racer (Vintage Runner cover)",d:"Vintage Runner magazine cover",img:"images/vintage-runner-tuxedo-racer-cover-p1.jpg"},
    {n:"Flexible Flyer (1911 ad)",d:"Youth's Companion, 7 Dec 1911 · period ad",img:"images/ad-flexible-flyer-youths-companion-1911.jpg"},
    {n:"Flexible Flyer (1915 ad)",d:"Evening World, 10 Dec 1915 · period ad",img:"images/ad-flexible-flyer-evening-world-1915.jpg"},
    {n:"Fairy Coaster",d:"Earlier Allen sled (collector's book)",img:null},
    {n:"Phantom",d:"Earlier Allen sled (collector's book)",img:null},
    {n:"Fleetwing (1884)",d:"Earlier Allen sled (collector's book)",img:null},
    {n:"Ariel",d:"Earlier Allen sled (collector's book)",img:null}],
 3:[{n:"Speedster",d:"c. 1920–1930 · Rosebud collection",img:"images/paris-speedster-full.jpg"},
    {n:"Speedster (deck)",d:"Rosebud collection",img:"images/paris-speedster-deck-p53.jpg"},
    {n:"Dirigo Clipper",d:"Date unknown · Rosebud collection",img:"images/paris-dirigo-clipper-p56.jpg"},
    {n:"Dirigo Clipper (deck)",d:"Rosebud collection",img:"images/paris-dirigo-clipper-deck-p56.jpg"},
    {n:"Paris Racer",d:"Matrix",img:null},
    {n:"Yankee Flyer",d:"Matrix",img:null},
    {n:"Speedway",d:"First steering sled, 1912 (collector's books)",img:null}],
 4:[{n:"Lightning Guider",d:"Hardware Age ad, 20 Jan 1917",img:"images/ad-standard-novelty-works-hardware-age-1917.jpg"},
    {n:"Streamlined Lightning Guider",d:"Dealer flyer, probably late 1960s · Rosebud collection",img:"images/standard-lightning-guider-dealer-flyer.jpg"},
    {n:"Master Bomber",d:"Matrix",img:null},
    {n:"Challenger",d:"Matrix",img:null},
    {n:"King of the Hill",d:"Matrix",img:null},
    {n:"Racer",d:"Briefs",img:null},
    {n:"Sno-ball",d:"Briefs",img:null}],
 2:[{n:"Fire Fly No. 12",brand:"Fire Fly",d:"Fire Fly brand of S. L. Allen & Co., per Jonathan Spangler · hand-painted leaf-vine deck · photo supplied by Jonathan",img:"images/ff-fire-fly-no12.jpg"}],
 6:[{n:"Fleetwing Steering Sled No. 100 & Racer No. 210",d:"Auto-Wheel catalog p. 19 · Rosebud collection",img:"images/ad-auto-wheel-fleetwing-p19.jpg"},
    {n:"Fleetwing Spring Top Flash (#41)",d:"1940 catalog photo, Jonathan Spangler",img:"images/fleetwing-spring-top-flash-1940.jpg"},
    {n:"Electric steering sled",d:"Buffalo Sled Co. ad (year not printed)",img:"images/ad-buffalo-sled-co-electric.jpg"},
    {n:"Auto Wheel Coaster ad",d:"Toys and Novelties, Aug 1920",img:"images/ad-auto-wheel-coaster-toys-novelties-1920.jpg"},
    {n:"Auto Wheel Coaster Wagon",d:"Principal product; namesake of the 1920 company rename",img:null},
    {n:"Coaster King",d:"Named among principal products in November 2026 research",img:null},
    {n:"Fleetwing",d:"Named among principal products in November 2026 research",img:null},
    {n:"Gliderole",d:"Briefs",img:null},
    {n:"[sample model]",d:"Placeholder",img:null,sample:true}],
 7:[{n:"Streamliner",d:"Photo supplied by Jonathan Spangler (the matrix lists “Steamliner”)",img:"images/garton-streamliner.jpg"},
    {n:"Eskimo",d:"First steerable, 1916 (collector's book) · photo supplied by Jonathan",img:"images/garton-eskimo.jpg"},
    {n:"Deluxe Racer",d:"Photo supplied by Jonathan Spangler",img:"images/garton-deluxe-racer.jpg"},
    {n:"Dreadnaught",d:"First steerable, 1916 (collector's book) · 3-view photo supplied by Jonathan",img:"images/garton-dreadnaught.jpg"},
    {n:"Trail",d:"Full sled + steering-bar close-up · photos supplied by Jonathan",imgs:["images/garton-trail.jpg","images/garton-trail-closeup.jpg"]},
    {n:"Dragon Head Sleigh",d:"c. 1902–1913 · Rosebud collection (4 photos)",imgs:["images/garton-dragon-head-sleigh-p52.jpg","images/garton-dragon-head-b.jpg","images/garton-dragon-head-c.jpg","images/garton-indian-chief-stencil-p52.jpg"]},
    {n:"Penguin",d:"Matrix",img:null},
    {n:"Silver Streak",d:"Matrix / briefs",img:null},{n:"Trailbreaker",d:"Matrix",img:null},{n:"Royal Racer",d:"Briefs",img:null}],
 8:[{n:"Red Rocket",d:"Photo supplied by Jonathan Spangler, Nov 2026",img:"images/pratt-red-rocket-jonathan.jpg"},
    {n:"Commodore",d:"Model name per Jonathan Spangler · photo supplied by Jonathan",img:"images/pratt-commodore.jpg"},
    {n:"Fly-Away",d:"“The New FLY-AWAY Line” steering coasters, period ad (year not printed) · supplied by Jonathan Spangler",img:"images/ad-pratt-flyaway.jpg"},
    {n:"“Chieftain” Red Rocket",d:"c. 1940–1952 · Rosebud collection",img:"images/pratt-chieftain-red-rocket-p55.jpg"},
    {n:"“Chieftain” Red Rocket (second view)",d:"Rosebud collection",img:"images/pratt-red-rocket-b.jpg"}],
 11:[{n:"Speed Demon",d:"c. 1938 · Rosebud collection",img:"images/kalamazoo-speed-demon-p58.jpg"},
    {n:"Speed Demon (second view)",d:"Rosebud collection",img:"images/kalamazoo-speed-demon-b.jpg"},
    {n:"Speed Demon (third view)",d:"Rosebud collection",img:"images/kalamazoo-speed-demon-c.jpg"},
    {n:"Champion Flying Disc",d:"Saucer, launched 1956 · photo supplied by Jonathan Spangler",img:"images/kalamazoo-champion-flying-disc.jpg"},
    {n:"Dealer ad",d:"Year not printed · photo supplied by Jonathan Spangler",img:"images/ad-kalamazoo-dealer.jpg"},
    {n:"Fleet Arrow",d:"Matrix (listed as “possibly”)",img:null},
    {n:"Flying Arrow",d:"Matrix (listed as “possibly”)",img:null}]
};

// ===== Sleds for Sale =====
// Required on a listing: sled name, photo(s), town/state, can ship (Yes/No), contact email. Price and description (max 500 characters) are optional.
// Who may POST a listing: "all" (anyone) or "premium" (subscribers only). Browsing is always open.
window.SALE_POSTING = "premium";   // Jonathan, 18 Nov 2026: only paid members can post
// l4 years: briefs date the pictured Kalamazoo Speed Demon c. 1938; the other samples are "Unknown".
window.SALE_LISTINGS = [
 {id:"l1", sledType:"Runner", years:"Unknown", ship:"Yes", email:"seller@example.com", user:"sample_seller", title:"[sample] Flexible Flyer with eagle deck", maker:1, model:"[sample] Eagle deck", condition:"Good", price:"$185", town:"Schaumburg, IL", img:"images/sale-flexible-flyer-eagle-deck.jpg", desc:"[sample] Original eagle-deck Flexible Flyer with light wear on the slats and surface rust on the runners. Steering works. Pickup preferred, will ship at buyer's cost."},
 {id:"l2", sledType:"Runner", years:"Unknown", ship:"No", email:"runnerfan@example.com", user:"example_runner_fan", title:"[sample] Garton sled, Indian Chief stencil", maker:7, model:"[sample]", condition:"Fair", price:"$240", town:"Elgin, IL", img:"images/sale-garton-indian-chief.jpg", desc:"[sample] Garton sled with the Indian Chief stencil still visible. Some paint loss on the deck. Local pickup only."},
 {id:"l3", years:"Unknown", ship:"No", email:"flyerhunter@example.com", user:"demo_flyer_hunter", title:"[sample] Hand-painted sled, maker unknown", maker:0, model:"Unknown", condition:"Fair", price:"$95", town:"Naperville, IL", img:"images/sale-hand-painted-sled.jpg", desc:"[sample] Hand-painted deck, maker unknown. Would love help identifying it. Local pickup only."},
 {id:"l4", sledType:"Runner", years:"c. 1938", ship:"Yes", email:"newcollector@example.com", user:"example_new_collector", title:"[sample] Kalamazoo Speed Demon", maker:11, model:"Speed Demon", condition:"Restored", price:"$150", town:"Kalamazoo, MI", imgs:["images/kalamazoo-speed-demon-c.jpg","images/kalamazoo-speed-demon-p58.jpg"], desc:"[sample] Speed Demon restored with new paint. Runners straight. Can ship within the US."}
];

// ===== Map lookup (town level only) =====
// Sample sled locations above are made-up example towns. User entries are matched against this table
// (common towns, then state centroids); anything not found falls back to OpenStreetMap Nominatim (low volume, mockup only).
window.TOWN_COORDS = {
 "schaumburg, il":[42.03,-88.08],"elgin, il":[42.04,-88.28],"naperville, il":[41.75,-88.15],"chicago, il":[41.88,-87.63],
 "aurora, il":[41.76,-88.32],"harvard, il":[42.42,-88.61],"rockford, il":[42.27,-89.09],"springfield, il":[39.80,-89.64],
 "palatine, il":[42.11,-88.03],"arlington heights, il":[42.09,-87.98],"hoffman estates, il":[42.06,-88.12],"libertyville, il":[42.28,-87.95],
 "milwaukee, wi":[43.04,-87.91],"sheboygan, wi":[43.75,-87.71],"madison, wi":[43.07,-89.40],"kalamazoo, mi":[42.29,-85.59],
 "coldwater, mi":[41.94,-85.00],"detroit, mi":[42.33,-83.05],"grand rapids, mi":[42.96,-85.67],"cedar falls, ia":[42.53,-92.45],
 "des moines, ia":[41.59,-93.62],"minneapolis, mn":[44.98,-93.27],"st paul, mn":[44.95,-93.09],"indianapolis, in":[39.77,-86.16],
 "toledo, oh":[41.65,-83.54],"columbus, oh":[39.96,-83.00],"cleveland, oh":[41.50,-81.69],"philadelphia, pa":[39.95,-75.17],
 "york, pa":[39.96,-76.73],"duncannon, pa":[40.40,-77.03],"bradford, pa":[41.96,-78.64],"pittsburgh, pa":[40.44,-80.00],
 "south paris, me":[44.22,-70.51],"portland, me":[43.66,-70.26],"boston, ma":[42.36,-71.06],"new york, ny":[40.71,-74.01],
 "buffalo, ny":[42.89,-78.88],"north tonawanda, ny":[43.04,-78.86],"binghamton, ny":[42.10,-75.92],"denver, co":[39.74,-104.99]
};
window.STATE_CENTROIDS = {AL:[32.8,-86.8],AK:[64.7,-152.0],AZ:[34.3,-111.7],AR:[34.9,-92.4],CA:[37.2,-119.5],CO:[39.0,-105.5],CT:[41.6,-72.7],
 DE:[39.0,-75.5],FL:[28.6,-82.4],GA:[32.7,-83.4],HI:[20.8,-156.3],ID:[44.4,-114.6],IL:[40.0,-89.2],IN:[39.9,-86.3],IA:[42.1,-93.5],
 KS:[38.5,-98.4],KY:[37.5,-85.3],LA:[31.1,-92.0],ME:[45.4,-69.2],MD:[39.0,-76.8],MA:[42.3,-71.8],MI:[44.3,-85.4],MN:[46.3,-94.3],
 MS:[32.7,-89.7],MO:[38.4,-92.5],MT:[47.0,-109.6],NE:[41.5,-99.8],NV:[39.3,-116.6],NH:[43.7,-71.6],NJ:[40.2,-74.7],NM:[34.4,-106.1],
 NY:[42.9,-75.5],NC:[35.6,-79.4],ND:[47.5,-100.5],OH:[40.3,-82.8],OK:[35.6,-97.5],OR:[43.9,-120.6],PA:[40.9,-77.8],RI:[41.7,-71.5],
 SC:[33.9,-80.9],SD:[44.4,-100.2],TN:[35.9,-86.4],TX:[31.5,-99.3],UT:[39.3,-111.7],VT:[44.1,-72.7],VA:[37.5,-78.9],WA:[47.4,-120.5],
 WV:[38.6,-80.6],WI:[44.6,-89.9],WY:[43.0,-107.6],DC:[38.9,-77.0]};

/* Companies with several brands. Per Jonathan Spangler, S. L. Allen & Co. (the Planet Jr. company)
   made three sled brands. Matrix rows #1 and #2 stay as separate rows but are cross-linked as one company.
   Brand access follows its matrix row: #1 is free, #2 is premium (pending Jonathan's decision). */
window.COMPANIES=[{name:"S. L. Allen & Co. (Planet Jr.)",note:"Per Jonathan Spangler, S. L. Allen & Co., the Planet Jr. company, made three sled brands.",
  brands:[{name:"Flexible Flyer",maker:1},{name:"Fire Fly",maker:2},{name:"Yankee Clipper",maker:2}]}];
window.MAKER_LABELS={2:"Fire Fly / Yankee Clipper (S. L. Allen & Co.)"};

// ===== Sled Picker Map: 25 black-list maker filter entries =====
// Matrix has 24 black (book) makers; Fire Fly and Yankee Clipper are split into
// their own entries (Jonathan, 19 Nov 2026) and kept apart from Flexible Flyer.
// Green-list makers and company briefs are not the dropdown source.
// Keys "firefly" and "yclipper" both point at matrix #2.
window.MAP_MAKERS = [
  {key:"fflyer",     id:1,  label:"Flexible Flyer – Planet Jr / S.L. Allen Co.", color:"#C62828", short:"Flexible Flyer"},
  {key:"firefly",    id:2,  brand:"Fire Fly", label:"Fire Fly – Planet Jr / S.L. Allen Co.", color:"#EF6C00", short:"Fire Fly"},
  {key:"yclipper",   id:2,  brand:"Yankee Clipper", label:"Yankee Clipper – Planet Jr / S.L. Allen Co.", color:"#F9A825", short:"Yankee Clipper"},
  {key:"paris",      id:3,  label:"Paris", color:"#2E7D32", short:"Paris"},
  {key:"snw",        id:4,  label:"Standard Novelty Works (Lightning Guider)", color:"#1565C0", short:"Lightning Guider"},
  {key:"acme",       id:5,  label:"American Acme Company", color:"#6A1B9A", short:"American Acme"},
  {key:"autowheel",  id:6,  label:"Buffalo Sled Co. / Auto Wheel Coaster Co.", color:"#00838F", short:"Auto-Wheel Coaster"},
  {key:"garton",     id:7,  label:"Garton Toy Company", color:"#AD1457", short:"Garton"},
  {key:"pratt",      id:8,  label:"Pratt Mfg Co.", color:"#6D4C41", short:"Pratt"},
  {key:"crs",        id:9,  label:"Chicago Rollerskate Co.", color:"#2a6f7a", short:"Chicago Rollerskate"},
  {key:"tt",         id:10, label:"Turner and Thomas", color:"#6b4e31", short:"Turner & Thomas"},
  {key:"kal",        id:11, label:"Kalamazoo Sled Company", color:"#283593", short:"Kalamazoo"},
  {key:"anc",        id:12, label:"The American National Company", color:"#4a6b2f", short:"American National"},
  {key:"rw",         id:13, label:"Richards & Wilcox", color:"#7a3e8c", short:"Richards & Wilcox"},
  {key:"cjj",        id:14, label:"C.J. Johnson Co. (Safety sled)", color:"#8b4513", short:"C.J. Johnson"},
  {key:"maple",      id:15, label:"Maplewood Craft Industries", color:"#0e6b5c", short:"Maplewood Craft"},
  {key:"wagner",     id:16, label:"Wagner", color:"#b03a2e", short:"Wagner"},
  {key:"starline",   id:17, label:"Hunt, Helm, Ferris & Co. (Starline)", color:"#1a5276", short:"Starline"},
  {key:"duralite",   id:18, label:"Duralite", color:"#717d7e", short:"Duralite"},
  {key:"snowhawk",   id:19, label:"“Snow Hawk” (American Gold Co.)", color:"#1b4f72", short:"Snow Hawk"},
  {key:"crosby",     id:20, label:"Crosby Gilzinger Co.", color:"#6e2c00", short:"Crosby Gilzinger"},
  {key:"ellingwood", id:21, label:"Ellingwood Turning Company", color:"#145a32", short:"Ellingwood"},
  {key:"withington", id:22, label:"Withington", color:"#4a235a", short:"Withington"},
  {key:"wilkinson",  id:23, label:"Wilkinson", color:"#7d6608", short:"Wilkinson"},
  {key:"miller",     id:24, label:"Maynard Miller", color:"#1c2833", short:"Maynard Miller"}
];

// Northeast demo pins (200 SAMPLE points, not real finds) live in map-pins.js,
// generated deterministically by scripts/generate-sled-picker-pins.py.
