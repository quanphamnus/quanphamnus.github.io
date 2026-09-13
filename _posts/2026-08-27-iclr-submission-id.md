---
title: 'Does Your ICLR Submission ID Matter?'
date: 2026-09-04
permalink: /posts/iclr-submission-id/
description: "Lower submission IDs are linked to higher acceptance rates in recent ICLR data, but I do not yet know why."
tags:
  - ICLR
  - Data Analysis
  - OpenReview
---

At ICLR 2026, ***33% of papers in the earliest 10% of submission IDs were accepted***. In the latest 10%, it was ***just 20%***. What surprised me more was how recently this gap appeared.

Recently, I heard that some people open their OpenReview submissions early just to claim a low paper ID. It takes only a few minutes, so if it offers even a tiny advantage, why not?

I checked five years of ICLR submissions, from 2022 to 2026, to see whether there was anything behind this idea. Submission IDs are assigned in creation order, so a lower number means the submission was opened earlier.



## Does a lower submission ID mean a higher acceptance rate?

I sorted papers by submission ID and split them into ten roughly equal-sized groups, or deciles, from the earliest 10% to the latest 10%:

![Acceptance rate by submission-ID decile for ICLR 2025 and 2026](/images/iclr-submission-id/fig2-deciles.png)

*Acceptance rate by submission-ID decile for ICLR 2025 and 2026. Dashed line is overall acceptance rate.*
{: .text-center}

In 2025, ***36.7%*** of papers in the earliest 10% were accepted, compared with ***27.7%*** in the latest 10%. In 2026, the rates were ***33.0%*** and ***20.3%***, respectively. 

Acceptance rates were even lower for submissions created in the final six hours: 24.1% of 470 submissions in 2025 and 18.3% of 1,083 in 2026.

Of course, this is correlation, not evidence that having a low paper ID will get your work accepted. But if you needed one more reason not to wait until the last few hours to create your OpenReview submission, there it is!


## But this pattern only appeared recently

The surprise came when I compared all five years:

![Acceptance rate by submission-ID decile, ICLR 2022-2023 on the left and 2024-2026 on the right](/images/iclr-submission-id/fig3-years.png)

*Acceptance rate by submission-ID decile, ICLR 2022-2023 on the left; 2024-2026 on the right, with the same axes.*
{: .text-center}

| Year | Papers | Decile 1 | Decile 10 | 
|---|---|---|---|
| 2022 | 3,422 | 36.4% | 33.2% |
| 2023 | 4,955 | 29.8% | 30.8% | 
| 2024 | 7,404 | 32.1% | 26.2% | 
| 2025 | 11,672 | 36.7% | 27.7% | 
| 2026 | 19,814 | 33.0% | 20.3% |

In 2022 and 2023, there is ***no*** clear or consistent early-submission advantage. The pattern first appears in 2024, when the acceptance rate for the first decile was about ***5.9%*** higher than that of the last decile. The gap then widened to ***9.0% in 2025*** and ***12.7% in 2026***.


I do not yet have a good explanation for this, and I have not run formal statistical tests, so I cannot make a formal claim about statistical significance. Still, the trend in the raw data looks quite clear. Together with the recent boom in submission numbers, this makes me wonder: *what, exactly, has changed in the last few years?* I will not put my guess here, but maybe you already have yours...



## What about institutions?


I selected the 50 institutions with the most accepted papers in each year. The top 20 are labeled directly in the figures.

The horizontal axis shows each institution's median submission percentile rather than the raw submission number, so the two years can be compared directly even though their ID ranges are very different.


![Median submission-ID percentile against acceptance rate for the 50 institutions with the most accepted ICLR 2025 papers.](/images/iclr-submission-id/fig4-institutions-2025.png)

*ICLR 2025. Bubble size represents the number of accepted papers. The dashed lines mark the overall acceptance rate.*
{: .text-center}

![The same chart for ICLR 2026, showing the same left-right split between Chinese and US institutions](/images/iclr-submission-id/fig4-institutions-2026.png)

*ICLR 2026. Same rules and axes as above.*
{: .text-center}

Among these institutions, there is no clear link between earlier submissions and higher acceptance rates. Many large institutions with higher submission IDs remain well above the overall rate.

So, one more reminder: the findings in this blog are fun and surprising patterns, not a submission strategy.

Chinese and US institutions make up over 80% of each group (41/50 in 2025 and 42/50 in 2026). In both years, Chinese institutions tend to create submissions earlier than US institutions.

The clearest exception is NVIDIA. Its median submission percentile is much lower than those of the other US institutions, while its acceptance rate is close to 50% in both years.

| Group | Institutions | Median submission percentile | Average acceptance rate |
|---|---|---|---|
| Chinese institutions, 2025 | 17 | 41% | 35.2% |
| US institutions, 2025 | 24 | 58% | 42.3% |
| Chinese institutions, 2026 | 23 | 35% | 32.8% |
| US institutions, 2026 | 19 | 57% | 36.9% |


Since most submissions are created in the final few days, part of the difference between countries could simply come from time zones and normal working hours. So again, I would be cautious about drawing broader conclusions about institutions or countries from these figures.


## When are submissions created?

![Submissions per day before the deadline, ICLR 2025 and 2026](/images/iclr-submission-id/fig1-when.png)

*Submissions per day before the deadline, ICLR 2025 and 2026.*
{: .text-center}




Despite all this discussion of early submissions, around two-thirds were created in the final 72 hours before the deadline in both years.

Finally, submissions come from all around the world, but their creation times still follow a surprisingly clear daily rhythm. I plotted the share created in each UTC hour, excluding the final 48 hours. The deadline falls at the same moment for everyone, so the rush during those last two days could hide the usual pattern.

![Submissions by UTC hour of day, 2025 and 2026](/images/iclr-submission-id/fig7-clock.png)

*Submissions by UTC hour of day, 2025 and 2026.*
{: .text-center}

The busiest hour is *07:00–08:00 UTC* in both years, while the quietest is *23:00–00:00 UTC*. Apparently, even a global submission queue has a daily routine.
...


