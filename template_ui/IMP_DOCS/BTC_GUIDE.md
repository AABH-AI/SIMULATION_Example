# Bend the Curve — Complete System Reference
## ISG BPA Forecast Adjustment System

---

## 1. What This System Does

The Bend the Curve system adjusts data science time series forecasts to align with Service Modernization (SMOD) targets. Doug described it as "the most critical part of the process" [6]. The data science model predicts dispatches based on historical patterns but does not account for planned engineering improvements, quality initiatives, or organizational commitments to reduce dispatch rates.

Doug: "We have the forecast data science process that runs, gets loaded into the adjustment cube. Then we have the planning part of it. This is really the planning part of it. This is making sure that everything ties out to the plans." [6]

Doug: "ultimately, the goal through this adjustment process is to tie out to what these modernization targets are" [6]

---

## 2. People Involved

| Person | Role |
|--------|------|
| Doug O'Neill | Makes all adjustments, sizes BTC modifier, enters values into OLAP cube [6] |
| Mark Mazza | Oversees validation in Julius, manages VMR file [6] |
| Francisco | Extracts from adjustment cube, loads into Julius [6] |
| Brandon Adams | Runs data science time series model [6] |
| Zooey | Runs ASU forecast process, reloads to cube [6] |
| Gordon Kelly | Validation support [6] |
| Joanna Gu | Program lead, strategic direction [6] |
| Yubhindra | Consolidates triad initiative spreadsheet every Friday [6] |
| Mike | Calculates post-UCR SRs for headcount and capacity planning [6] |
| David Cooper | GPM lead driving JIRA migration for initiative tracking [6] |

---

## 3. Data Sources

### 3.1 Adjustment Cube

Doug: "these are basically cubes, that's all they are. I've set up a pivot table that links to USDM. Julius pulls from USDM, so I'm linked to that, basically." [6]

### 3.2 Julius / USDM

Provides historical actuals for dispatches, SRs, ASUs. Also provides expiring ASU data used as reference. Doug: "the reason I have these side by side is, this is one of my quality checks, quality controls, is to say, does the history that was used for the forecast, does it match Julius?" [6]

### 3.3 SMOD Targets Excel

Doug: "it sits in a file that Mark manages, yeah, so I'll go out and open that file and compare it to what we have" [6]

This file is not in any database. Doug: "it's not anywhere in any database, like Hadoop or Julius. It's all manual right now." [6]

Mark: "there's this gargantuan spreadsheet that's out there that has a tab by product that contains all of the initiatives by product" [6]

Mark: "it's updated weekly, one single location, so he pulls it in every Friday, he refreshes his data, they update that worksheet every single day, all day" [6]

### 3.4 IQR vs No IQR

Doug: "For storage products, the one with IQR doesn't work very well. It works pretty good for client products. So I use the dispatch with no IQR as my starting point" [6]

### 3.5 Scenario Model Excel (Contracts_View_Dummy.xlsx)

The ASU scenario model file contains weekly ASU data for POWEREDGE-ESG [4] [5]:

Header: Scenario Model, FY27 Pass 2, Prod Bu Type: Enterprise Solution Group PBU, LOB Name: POWEREDGE, GSD LOB BU: POWEREDGE - ESG [5]

Key columns from the Excel file [4] [5]:
- Weekly Field ASUs (ALL): 7.0M to 8.0M range
- Weekly Field Expiring ASUs (ALL): 19K to 41K range
- Weekly Field Shipped ASUs (ALL): 18K to 40K range
- New Contract: 19K to 41K range
- APOS Renewal: 19K to 41K range
- BTC column: only two populated values, V93 = 191 and V94 = 441
- Adj New (PV New in Excel): 18,957 to 41,446 range (nearly identical to New Contract)
- BTC APOS (PV APOS in Excel): 100 to 499 range (dramatically reduced from APOS)

---

## 4. Quality Check — First Step

Before any adjustments, Doug validates that the adjustment cube data matches Julius.

Doug: "does the history that was used for the forecast, does it match Julius? Because Julius pulls from the same data source that Brandon is using to put together the time series table. So, in theory, this should all match. That's my first check that I do." [6]

Verified values from the KT session:
- ASUs: approximately 277,597 [6]
- Work orders: 527 in both sources — match confirmed [6]

Doug: "the difference is immaterial to how... to our rates when we get our rates all set" [6]

---

## 5. Triads and SMOD Targets

### 5.1 What Triads Are

Doug: "it's like 3 leaders — Engineering, supportability, serviceability" [6]

Joanna: "because they're in a room together, and they can collectively see the data together, they can say, okay, well, I'm gonna make quality improvements so they can be easier to diagnose" [6]

The three teams:
- Engineering — product design and quality improvements
- Quality / Serviceability — diagnosability, self-heal, auto-resolve
- Services — technology improvements, dispatch accuracy, repeat reduction

### 5.2 How Targets Are Set

Doug: "this team come up with a number, based on their consensus" [6]

### 5.3 SMOD 1.0 vs 2.0

Mark: "SMOD 1.0 was very prescriptive. Get to a 3-year target, 35%, and we just kind of go in a downward trend per leadership as aggressively as possible" [6]

Mark: "SMOD 2.0, when we talk about these adjustments, inherently, that's going to be a program that focuses on vintage and ship year. And so, as we discuss being able to adjust or manipulate the targets, those are the areas for which we will have prescribed adjustments to be made." [6]

Mark: "we must be able to say, hey, I need to bring this ship vintage year down by 11%, because that's the corporate commitment. So they have to be held to that. But years 4, 5, and 6, or greater, just let it ride. Use your proper business rules and let that just kind of ride, because they cannot influence development there." [6]

### 5.4 JIRA Migration

Mark: "David Cooper, who's the GPM lead in that program, to get out of a spreadsheet-managed process and get us into the OneDellWay model, which will have a leverage of JIRA" [6]

Mark: "the data that we need, that you all need, is not contained in JIRA. There is no field values for the initiatives, the percentage of adoption. There's no value for ICR" [6]

Mark: "there's like 10 that don't exist that we would need" [6]

---

## 6. The Bend the Curve Calculation

### 6.1 Core Concept

Doug: "it's basically doing a running calculation that says, I have to adjust a certain amount, and I'm gonna increment that adjustment over time so that it starts to bend it down. That's how the calculation works." [6]

Doug: "I don't want a lot of change at the beginning, so I'm going to increment the change over time. That's basically all it's doing. It's rounding it out." [6]

### 6.2 Why Incremental

Doug: "we're going to go through the year, we're going to get some changes implemented, some initiatives are going to kick in, and then over time, it's going to start to accumulate, and we're going to get that net effect of all those adding up towards the second half of the year" [6]

### 6.3 The Modifier

Doug: "if I put 80%, it's taking 20% and spreading it out across the number of weeks that I'm changing" [6]

Demonstrated behavior during the KT session:
- At 100%: No change — adjusted equals forecast [6]
- At 85%: Gap is approximately 6% from target [6]
- At 80%: Gap is approximately 2% from target [6]
- At 77%: Demo value — produces 14,389 dispatches at rate 0.131 [6]

### 6.4 Verified VXRail Example

All numbers explicitly stated by Doug [6]:

| Metric | Value |
|--------|-------|
| Product | VX4L (also called VXRail) |
| DS Forecast (No IQR) | 15,674 dispatches |
| SMOD Target | 14,210 dispatches |
| Forecast Rate | 0.143 |
| Target Rate | 0.130 |
| Modifier Set To | 77% |
| Adjusted Dispatches | 14,389 |
| Adjusted Rate | 0.131 |
| First Forecast Week | FW 40 |
| Last Forecast Week | FW 52 |
| Weekly Total Before Split | 380 |

### 6.5 Formula (Reverse-Engineered)

The following formula reproduces Doug's exact outputs:


Note: The power-8 exponent was reverse-engineered. Doug never stated the exact formula. He described the behavior and the outputs. The exponent produces matching results at all verified checkpoints.

### 6.6 Usage Frequency

Doug: "probably 95% of them are made this way" [6]

### 6.7 What Doug Monitors

Doug: "as I do these changes, I'm really keeping an eye on a couple of things... How close am I getting?" [6] — specifically the dispatch count gap and the rate gap.

---

## 7. OLAP What-If Analysis

### 7.1 How Values Get Entered

Doug: "on the back end, there is this OLAP analysis, what-if analysis that's been enabled" [6]

Doug: "Francisco's gone in and said, in the adjustment cube, I have certain fields that are labeled adjusted. I want Doug or Jeff on the CSU side to be able to go and adjust those values." [6]

Process:
1. Doug copies adjusted values from his calculation
2. Pastes as values only into the adjustment field
3. A red mark appears — "indicated by the red mark" [6]
4. Goes to What-If Analysis, clicks Publish Change — "I can publish the change" [6]
5. If wrong, clicks Discard — "I can discard the value, and it'll go back to what it was" [6]

### 7.2 Allocation

Doug: "it's gonna do it weighted. So it's gonna basically just take it and put it all the way down to the lowest level" [6]

Allocation goes to: regions, countries, core/upsell, and other lowest-level dimensions [6].

Doug explicitly rejected equal allocation: "if it's 10 allocations, then we don't want that to happen" [6]

### 7.3 Limitations

Doug: "it only takes values, I can't paste a formula" [6]

Doug: "It won't take multiple values. You can't pivot multiple values, and it throws an error" [6]

Doug: "it doesn't take zeros. You can't enter, you can't change zero, it'll give you an error" [6]

Mark: "There's a lot of work going on in the cube at the moment because of all the delays and the refresh. I've been struggling." [6]

### 7.4 What Gets Loaded

Doug: "when I publish the values, it would go straight into the adjustment queue" [6]

Doug: "there was a dispatch adjusted field created, which is a copy of the original dispatch forecast, and we were able to adjust that field" [6]

---

## 8. The 4-Tab Storage Product Complication

### 8.1 The Problem

Doug: "VxRail shows up in both ESG and ISG" [6]

Doug: "I can't just go, hey, I want parts only dispatches, and I want VXRail. I have to go, I want VXRail, ESG, I want parts only. I want VXRail, ISG, parts only. So the number of adjustments starts to multiply" [6]

### 8.2 The 4 Intersections

Doug: "For one adjustment, I have to create 4 tabs." [6]

| Tab | Product BU | Service Type |
|-----|-----------|--------------|
| 1 | ESG | Parts and Labor |
| 2 | ISG | Parts and Labor |
| 3 | ESG | Parts Only |
| 4 | ISG | Parts Only |

### 8.3 How the Split Works

Doug: "I've sized the adjustment. So, once it's sized, I know my adjustment lever was changed to 77%. So, it just so happens that as I create these tabs, and I change all the filters, that 77% applied to every... all four intersections of data, it adds up very closely to the initial adjustment." [6]

The values are NOT equal across tabs:
- ISG Parts and Labor: 258 weekly [6] — Doug: "that 380, if you remember that number, is now turned into 258"
- ESG Parts Only: 2 weekly [6] — Doug: "I have a value of 2 in this example, really small"
- ESG Parts and Labor: Not shown in KT
- ISG Parts Only: Not shown in KT

### 8.4 Dual-BU Products

Doug: "all the storage products have this dual product BU type, so, you know, PowerScale, VXREL, PowerFlex" [6]

Doug: "PowerScale, Data Domain, PowerFlex, VXREL... so maybe I was off, like, maybe 5 of those I do that with" [6]

### 8.5 SRs Are Simpler

Doug: "SRs is not as many adjustments, because there's not parts SRs and parts only SRs... Instead of 4 adjustments, VXRL example, just ESG and ISG. There's not different types of SRs." [6]

### 8.6 Product Count

Doug: "15 to 20 lobs. Some of them are small enough that they don't need much, if any, adjusting, but we have 12, 13 products, Mark? Keep me honest, 13 products that are scoped as service modernization." [6]

---

## 9. ASU Contract Adjustments

### 9.1 Same Methodology

Doug: "this file is pretty much the same process, the same adjustment process" [6]

Doug: "I have the bend the curve calculation in there, it's all the same" [6]

### 9.2 Two Adjustable Fields

Doug: "If you look in rows O and P, they're called New Contracts and APOS. Yeah, it's funny because it's called Ships Field Adjust. But it's new contracts and APOS contracts are two different things. So, yeah, in this example, I would have two, potentially two different fields that we would adjust." [6]

New Contracts: "the new contract field might need to be adjusted if we get guidance from FP&A on what the forecast should be, I might need to raise it up. Or if a product is losing momentum, I may need to bring it down" [6]

APOS: "APOS is what would remain... what percent of the decline would remain active" [6]

Doug: "20% of those, 30% of those would be how many actually renew and stay in the install company" [6]

### 9.3 BTC Column Values from Excel

From the Excel file [4] [5], only two rows have BTC values:

| Cell | APOS Input | BTC Output |
|------|-----------|------------|
| V93 | 30,799 | 191 |
| V94 | 33,262 | 441 |

The BTC column values are in the same range as the Adj APOS (PV APOS) column (100-499), confirming that BTC = the APOS adjustment output [4] [5].

The Adj New (PV New) column shows values nearly identical to original New Contract values (18,957 to 41,446 vs 18,981 to 41,044), confirming minimal BTC effect on New Contracts [4] [5].

### 9.4 Expiring Field Complication

Doug: "there isn't an expiration. Zooey has an expiration, but it's not loaded into the adjustment cube yet. So I don't have anything to use to say what is my expiration going to be, but fortunately, I do have Julius that has the expiring" [6]

Doug: "after we do this whole process and we make the adjustments, it's loaded, Zooey runs her process, now she loads everything back into the adjustment queue. So once it's loaded back in the adjustment queue, now I have expiring." [6]

### 9.5 ASU Adjustment Sequence

Doug: "first step is to align to, if we have a shipment forecast to use, I would align to that, step one. Step two is use a false renewal rate, and then we want to see a smooth curve here, because you're not going to see that type of change" [6]

---

## 10. Quarterly Phasing

### 10.1 What It Is

Doug: "the targets are built, they're quarterly targets. So, going back to the multi-step approach, the first step is to get the sizing in place at an annualized level. I'll make an adjustment there. I'll go check, and then I have another file, where I go work through the quarters and potentially rebalance some things" [6]

### 10.2 How It Differs From BTC

Doug: "instead of using the bend the curve calculation, I literally use a percent. I calculate what is it currently, what is it going to be, what's that percent different, I paste it, and then I say whatever's in there currently times that number, and then it equals the target, and then I go check." [6]

### 10.3 The FY26 Lesson

Doug: "for the FY26 forecast, what we received was literally a shift down. So they took the targets for the year, annualized target, and they just divided it by 4." [6]

Doug: "that's not realistic. But I loaded it that way, only to come back and then work with Mark to kind of tilt it back up to rephase it" [6]

Doug: "instead of having this shift down, it starts here and intersects with that shift down, so you get a higher starting point and a lower ending point, and you get the same number" [6]

### 10.4 Leadership Direction

Joanna: "we don't want that to suddenly Q4 drop, and then a spike back up in Q1" [6]

Joanna: "the quarterly phasing was asked because we got that direction -- let's not have a cliff drop and then a summit" [6]

---

## 11. Extraction and Validation Pipeline

### 11.1 From Cube to Julius

Doug: "Francisco goes in, and when we say, hey, Francisco, we're finished with the adjustments, he goes in and he extracts the fields needed to then create a forecast series in Julius" [6]

Doug: "Brandon has a process that says, take that data, put it into Julius now, and call it this, whatever the forecast series is" [6]

### 11.2 Validation

Mark: "we validate when it gets into Julius, and then he's able to fix it if we do find mistakes. So, what we have an understanding going in. He does a good job of making sure that the messages we've communicated and the volumes we've communicated align to how they emanate from the adjustment cube." [6]

### 11.3 Visibility Gap

Doug: "nobody has access to this, because it's sort of a playground, a scenario modeling. The way we do it today is, I put them in, but people can't see them until they show up in Julius." [6]

Doug: "if it was in Power BI... the validation would be a lot faster. People could go match up the numbers" [6]

### 11.4 Error Rate

Doug: "there's usually a handful of mistakes that end up making their way through, just because of the sheer number of... they're not necessarily big mistakes, but they're some little things we kind of get through every once in a while" [6]

Doug: "version control... that gets to be tough over time" [6]

### 11.5 Iterative Feedback

Doug: "Mark might find something in his validation, say, man, PowerScale looks like it's a little bit different... Then I have to go in and make an adjustment real quick, and then it's sort of like, it becomes a me, Mark feedback, or Tom feedback, I make the adjustment, I go to Francisco, re-extract, upload to Julius" [6]

Doug: "99% of it, typically, that goes in, if not more, is usually good" [6]

---

## 12. Actuals Handling in the Gap

Doug: "there's a gap between forecast comes out... by the time the process finishes, and runs, and we get this, there could be 2 or 3 weeks between" [6]

Doug: "those 2 or 3 weeks that the forecast value came out, we actually have an actual for it now in Julius. So we'll take that actual value and override the forecast value so that everything ties out." [6]

Doug: "26274 was an actual value that came out, so that doesn't need to be adjusted, that really is the number" [6]

Doug: "it's the same treatment. Any new value you put into that adjustment field, it's gonna, if it overrides the current value... whether it's an actual week or a forecast week, it all gets entered and allocated down." [6]

---

## 13. Edge Cases and Workarounds

### 13.1 Geo Noise in SR Forecast

Doug: "there was a geo problem in the SR forecast, so instead of doing one adjustment, I had to create a calculator that allocated the adjustments across the regions, so I actually had to enter three columns and put those in all at one time" [6]

Doug: "anybody that reports on SR forecasting now, and wants to do forecasts versus actuals, has to go in and pick Amer, APJA, and EMEA. If you don't filter your territories out, your regions out, you're picking up other SRs that we don't want to count." [6]

### 13.2 Product Hierarchy Changes

Doug: "ECS and ObjectScale were combined, so there was two sides of that. There was the product hierarchy changed to feed directly into Julius, and then there was Francisco going in and actually doing a search and replace for those product, ECS, changing it out to ObjectScale." [6]

### 13.3 Zero-Value Weeks

Doug: "another limitation to OLAP, it doesn't take zeros. You can't enter, you can't change zero, it'll give you an error, so it's got to have an actual value greater than zero" [6]

Doug: "sometimes I have to work around those zeros, and there's a formula to do that" [6]

### 13.4 Product Quality Excursions

Doug: "there can be some seasonality in here that is not something that happened last year. It was a product quality defect that started to show up a lot of the data, and then of course, we have a process to go figure out how to root cause and fix it. Those can go on for 6, 8 weeks" [6]

### 13.5 PowerEdge AI

Joanna: "the volume is so low, since fiscal year 24 compared to now, that the modeling is done manually" [6]

Mark: "in our Dell AI product, there's actually two aspects of that product. There's Dell designed and non-Dell. So we have NVIDIA and AMD, they contribute to the design, and in that product, they do a full node sled-type replacement, because they do not have OEM component replacements." [6]

Doug: "seems like every week now, Mark, we're running a different forecast" [6]

---

## 14. Process Timing

Doug: "if the process runs like it's supposed to, I get about 2 days for dispatches and 2 days for SRs" [6]

Doug: "ASUs are about the same, yeah, 2 or 3 days. It's a little trickier, because it has the extra process of, we make the adjustments, Zooey picks it up, forecasts it, then loads it back in" [6]

Doug: "we do it at the beginning of the year, pretty much, for the fiscal year plan. It goes out 5 quarters" [6]

Doug: "we just finished the AOP for this year, and that started in fiscal week 35, 36" [6]

---

## 15. Day 2 Additions

### 15.1 Adjustment Order

Doug mentioned on Day 2: "every level I'm gonna show is adjustable, pretty much. And so it'll be like an extension of yesterday." [3]

Doug: "I have a tab that has the priorities, lobs, starting with the lab volume, and then going to upsell, and so I have a list of priorities" [2] [3]

Doug said PowerScale has significant volume: "PowerScale has the lion's share of dispatches" [3] and that he could "pick up the target for, in that example, power scale, and that'll be my first lob I go adjust" [2] [3]

Doug: "I hit the 8 to 10 products, and then I kind of hit the rest from there and see if there's anything that stands out. It'd be the rest of ISG." [3]

Joanna asked Doug to document the order: Doug agreed: "I can do that, for sure, it's easy enough" [2] [3] and said "I'll document everything, and I'll clean it up in terms of making it look more like a hierarchy, how I go through it" [2] [3]. The actual documented list was not provided during the recorded sessions.

### 15.2 Upsell

Doug: "I go through all of them. I mean, there's really not one. All of them have upsell dispatches" [3]

Doug: "I obviously prioritize them" [3]

The core vs upsell distinction involves financial accounting rules: "there's some financial rules that are around how it's going to upsell" [2]

Note: Doug also said "I don't need core upsell" [3] when discussing his filter setup — meaning he removes that filter when working, not that he adjusts them separately.

### 15.3 Region-Level Adjustments

Doug: "we need to get to region, and we'll be able to do that as the process gets more efficient, but unfortunately, that's not in here. It doesn't mean I won't spot check, but I'm not going to put it on here, because I don't truthfully put the effort into it that it deserves." [2] [3]

### 15.4 Flat File Workaround

Doug: "the filters are not working. I'll create a flat file of sample data, I'll just set up a table, and then I'll link a pivot table to that" [2]

### 15.5 Mark's Triad File

Doug: "I do need the location of Mark's latest triad file. That would help with this discussion." [2] [3]

Doug: "it probably won't take very long. Probably take 15-20 minutes, just to go through and look at the lobs, and the layout, and the commitments, and how I connect it to what I'm doing" [3]

### 15.6 Initiative Tracking Challenge

Doug described a past experience: "part of my job was to help people figure out how which initiative was working. And they would argue over it. We didn't have enough data to be able to say which was working, so people would say, mine's working. No, it's mine." [2] [3]

### 15.7 Software ASUs

Joanna: "we probably need to consider software ASUs at some point" [2]

Mark explained why software ASUs are currently excluded: "the definition of software ASU is not necessarily agreed upon, or as simple to agree upon. Also, the registration of software is to use that process is not consistent across all customers and products" [2]

### 15.8 Tech Refresh

Joanna: "if we know that there's going to be a big tech refresh, like a big push, with incentives, sales incentives, and customer incentives, for customers to upgrade from 14G to newer generations" [2]

---

## 16. Downstream Dependencies

### 16.1 Post-UCR SRs

Joanna: "once Doug does his adjustments, then that's when he calculates the post-UCR SRs. And that is how he uses that for capacity planning, for headcount planning" [6]

Mark: "there are only about 12 to 13 or something in that range that requires some augmentation" [6]

### 16.2 VMR Calculations

Mark: "I literally just did the math at a weekly level" [6]

Mark: "I have to do everything for the headcount planning team, bottoms up" [6]

### 16.3 Forecast Series

Doug: "the last one we did was FY27 AOP, November ISG, so that's our forecast series that we track the actuals against" [6]

---

## 17. Future State Requirements

### 17.1 Slider and Scenario Modeling

Doug: "a slider, some kind of slider, some kind of thing that would actually calculate this type of adjustment would be the ideal one" [6]

Doug: "along with that, a field where you can type in the numbers" [6]

Doug: "when you go onto a website, if you're modeling a loan, you kind of have some ways to change the numbers around. You can change the rate, you can change the length. It kind of needs that type of flexibility built into it." [6]

### 17.2 Multi-Dimensional Adjustment

Doug: "it's sort of dimensional. How much time do you want to adjust? How precise does it need to be? So you pick your time frame. You could say, I have 8 weeks I need to adjust because it's an anomaly based on last year." [6]

### 17.3 Real-Time Visibility

Doug: "anybody, anytime, being able to go to, if it's Power BI, if Joanna's in a meeting, and somebody says, hey, we're observing a change in product quality, be able to go run that through a quick model" [6]

### 17.4 Vintage and Generation Forecasting

Doug: "once you get that vintage dimension into the forecast, now you can actually do better analysis. If I do vintage on the left, and I do fiscal year quarter across the top, you can actually profile each product" [6]

Doug: "we have it in reporting, we can see in actuals, we can do a report like that, we just can't do a forecast like that" [6]

### 17.5 New Product Intake

Doug: "we need an intake process to be able to add that in. Somehow we need a way to say, we have a product roadmap, we have a new product, a new version of a similar LOB launching. We need to go ahead and build that in." [6]

### 17.6 Adjustment Types

Doug: "what are all the different scenarios we run into that we need to make adjustments for? Phasing, bend the curve, anomalies, seasonality. Then we can start thinking about how to build that functionality out." [6]

---

## 18. Verified Data Points

| Data Point | Value | Source |
|-----------|-------|--------|
| VXRail DS Forecast | 15,674 dispatches | [6] |
| VXRail SMOD Target | 14,210 dispatches | [6] |
| Forecast Rate | 0.143 | [6] |
| Target Rate | 0.130 | [6] |
| Modifier at demo | 77% | [6] |
| Adjusted dispatches at 77% | 14,389 | [6] |
| Adjusted rate at 77% | 0.131 | [6] |
| Gap at 80% modifier | approximately 2% | [6] |
| Gap at 85% modifier | approximately 6% | [6] |
| First forecast week | FW 40 | [6] |
| Last forecast week | FW 52 | [6] |
| Weekly total before split | 380 | [6] |
| ISG P&L tab weekly value | 258 | [6] |
| ESG PO tab weekly value | 2 | [6] |
| ASU quality check value | 277,597 | [6] |
| Work order match | 527 both sources | [6] |
| SMOD products count | approximately 13 | [6] |
| Total LOBs | 15-20 | [6] |
| Dual-BU products | approximately 5 | [6] |
| Dispatch adjustment time | approximately 2 days | [6] |
| SR adjustment time | approximately 2 days | [6] |
| ASU adjustment time | 2-3 days | [6] |
| Actuals override example | 26,274 | [6] |
| BTC column V93 | 191 | [4] [5] |
| BTC column V94 | 441 | [4] [5] |
| Excel Base ASUs range | 7.0M to 8.0M weekly | [4] [5] |
| Excel Expiring range | 19K to 41K weekly | [4] [5] |
| Excel New Contract range | 19K to 41K weekly | [4] [5] |
| Excel APOS Renewal range | 19K to 41K weekly | [4] [5] |
| Excel Adj New range | 18,957 to 41,446 | [4] [5] |
| Excel BTC APOS range | 100 to 499 | [4] [5] |

---

## 19. Data Still Needed

| Data | Source | Why Needed |
|------|--------|-----------|
| All LOB forecast/target/ASU/rate values | SMOD Excel via Yubhindra | Populate filters for every product |
| Per-intersection volume splits for 4-tab | Adjustment Cube | Values are NOT equal, cube determines them |
| FY26 values for any LOB | SMOD file | FY26 filter |
| Service type level splits | Adjustment Cube | P&L vs PO separate values |
| Quarterly target breakdowns | SMOD file | Quarterly phasing validation |
| Renewal rates per product | Doug's calculation | APOS adjustment |
| LOB adjustment priority order | Doug agreed to document later | Not provided during sessions |
| Triad commitment file layout | Mark/Yubhindra | Understand input structure |