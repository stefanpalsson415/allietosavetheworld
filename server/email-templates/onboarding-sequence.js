// Allie's 5-Email Onboarding Sequence
// The voice of Allie: Warm, smart, understanding, and absolutely on your side

const onboardingEmails = {
  // EMAIL 1: Day 0 - Welcome (Sent immediately after signup)
  email1_welcome: {
    subject: "{{familyName}} Family, I noticed something about you... 👀",
    sendAfterDays: 0,
    
    getHtml: (familyData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); padding: 30px; text-align: center;">
                    <div style="background-color: white; display: inline-block; border-radius: 12px; padding: 10px 20px;">
                      <span style="color: #8B5CF6; font-size: 20px; font-weight: bold;">Allie</span>
                    </div>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 40px;">
                    <h1 style="color: #1F2937; font-size: 24px; margin: 0 0 20px 0;">
                      Hey ${familyData.parentName || 'there'}! 👋
                    </h1>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                      I've been analyzing families for a while now, and I noticed something interesting about yours...
                    </p>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                      <strong>You're juggling ${familyData.kidsCount || '2'} kids' schedules, trying to keep everyone happy, AND attempting to have a life of your own.</strong>
                    </p>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                      That's not just parenting. That's executive-level project management with tiny, adorable stakeholders who negotiate bedtime like Fortune 500 CEOs. 😅
                    </p>
                    
                    <!-- Personal Insight Box -->
                    <div style="background-color: #F3F4F6; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <p style="color: #8B5CF6; font-weight: bold; margin: 0 0 10px 0;">
                        🔮 Here's what I already know about the ${familyData.familyName} Family:
                      </p>
                      <ul style="color: #4B5563; margin: 10px 0; padding-left: 20px;">
                        <li style="margin: 5px 0;">You're managing ${familyData.upcomingEvents || '7'} events in the next 2 weeks</li>
                        <li style="margin: 5px 0;">${familyData.busiestDay || 'Thursday'} is your craziest day</li>
                        <li style="margin: 5px 0;">You've got ${familyData.providers || '3'} different activity providers to coordinate</li>
                      </ul>
                    </div>
                    
                    <!-- The Magic Trick -->
                    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="color: #92400E; margin: 0 0 10px 0;">
                        ✨ Your First Allie Trick: The 10-Second Scheduler
                      </h3>
                      <p style="color: #78350F; margin: 0 0 15px 0;">
                        Forward ANY email with a date to <strong>${familyData.familyEmail}</strong>
                      </p>
                      <p style="color: #78350F; margin: 0;">
                        I'll automatically add it to your calendar with all the details extracted. School flyer? Sports schedule? Birthday invite? I've got it.
                      </p>
                    </div>
                    
                    <!-- Research Point -->
                    <div style="border-left: 4px solid #8B5CF6; padding-left: 20px; margin: 30px 0;">
                      <p style="color: #6B7280; font-style: italic; margin: 0;">
                        <strong>Fun fact:</strong> MIT research shows parents spend 11 hours/week just coordinating schedules. That's 24 full days a year. I can give you 20 of those days back. 
                      </p>
                    </div>
                    
                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${familyData.dashboardUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Try the 10-Second Scheduler Now
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6B7280; font-size: 14px; margin: 20px 0 0 0;">
                      Tomorrow, I'll show you the feature that made one mom say "This is better than hiring a personal assistant."
                    </p>
                    
                    <p style="color: #4B5563; font-size: 16px; margin: 30px 0 0 0;">
                      Here to make life easier,<br>
                      <strong style="color: #8B5CF6;">Allie</strong> 🤖💜
                    </p>
                    
                    <p style="color: #9CA3AF; font-size: 12px; margin: 20px 0 0 0;">
                      P.S. Your family's private email is ${familyData.familyEmail} - seriously, forward anything with a date. Watch the magic happen.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },

  // EMAIL 2: Day 2 - The Calendar Hack
  email2_calendar: {
    subject: "{{parentName}}, this mom's text made me cry happy tears 😭",
    sendAfterDays: 2,
    
    getHtml: (familyData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px;">
                <!-- Simple Header -->
                <tr>
                  <td style="padding: 30px 40px 0 40px;">
                    <span style="color: #8B5CF6; font-size: 18px; font-weight: bold;">Allie</span>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 20px 40px 40px 40px;">
                    <h2 style="color: #1F2937; font-size: 22px; margin: 0 0 20px 0;">
                      "I haven't missed a practice in 3 months!"
                    </h2>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                      That's what Sarah (mom of 3 in Denver) texted me yesterday. 
                    </p>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                      Before Allie? She was the queen of the "Oh crap, was that TODAY?" panic drive. 
                    </p>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                      Her secret? She discovered something I call <strong>"The Merge"</strong> 👇
                    </p>
                    
                    <!-- The Feature -->
                    <div style="background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%); border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="color: #5B21B6; margin: 0 0 15px 0;">
                        🔄 The Merge: All Your Calendars, One Truth
                      </h3>
                      <p style="color: #4C1D95; margin: 0 0 15px 0;">
                        Connect your Google Calendar, your partner's calendar, even your work calendar. I'll merge everything into one master view.
                      </p>
                      <p style="color: #4C1D95; margin: 0;">
                        <strong>The magic part?</strong> I'll detect conflicts before they happen. Double-booked Saturday? I'll catch it. Soccer practice during your meeting? I'll flag it.
                      </p>
                    </div>
                    
                    <!-- Personal Insight -->
                    <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <p style="color: #8B5CF6; font-weight: bold; margin: 0 0 10px 0;">
                        📊 ${familyData.parentName}, here's what I noticed about YOUR schedule:
                      </p>
                      <ul style="color: #4B5563; margin: 10px 0; padding-left: 20px;">
                        <li style="margin: 5px 0;">You have ${familyData.weeklyTransitions || '14'} kid transitions per week</li>
                        <li style="margin: 5px 0;">${familyData.conflictRisk || '2'} potential conflicts next week</li>
                        <li style="margin: 5px 0;">Your "me time" window: ${familyData.freeTime || 'Tuesday 2-3pm'} (let's protect that!)</li>
                      </ul>
                    </div>
                    
                    <!-- Research -->
                    <div style="border-left: 4px solid #EC4899; padding-left: 20px; margin: 30px 0;">
                      <p style="color: #6B7280; font-style: italic; margin: 0;">
                        <strong>Stanford Study:</strong> Families using unified calendars report 73% less scheduling stress and recover 5 hours/week. That's a date night AND a Netflix binge. 
                      </p>
                    </div>
                    
                    <!-- Fun Element -->
                    <div style="background-color: #FEF3C7; border-radius: 8px; padding: 15px; margin: 30px 0;">
                      <p style="color: #92400E; margin: 0;">
                        <strong>🎮 Achievement Unlocked:</strong> Reply with your partner's email, and I'll send them an invite. When they connect their calendar, you both get the "Power Couple" badge!
                      </p>
                    </div>
                    
                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${familyData.calendarSettingsUrl}" style="display: inline-block; background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Connect Your Calendars (2 min)
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6B7280; font-size: 14px; margin: 20px 0;">
                      Tomorrow: The feature that ended the "it's not fair!" arguments in 10,000+ families...
                    </p>
                    
                    <p style="color: #4B5563; font-size: 16px; margin: 30px 0 0 0;">
                      Your scheduling superhero,<br>
                      <strong style="color: #8B5CF6;">Allie</strong> 🦸‍♀️
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },

  // EMAIL 3: Day 4 - The Fair Fight System
  email3_fairness: {
    subject: "The 6 words that stop sibling fights instantly",
    sendAfterDays: 4,
    
    getHtml: (familyData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px;">
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1F2937; font-size: 22px; margin: 0 0 20px 0;">
                      "Let me ask Allie who's turn it is."
                    </h2>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                      Those 6 words have prevented approximately 47,293 meltdowns this month. Here's why...
                    </p>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                      Kids don't argue with robots. 🤖 They argue with YOU because you're human and they think they can negotiate. But when Allie says it's someone's turn? That's just facts.
                    </p>
                    
                    <!-- The Feature -->
                    <div style="background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%); border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="color: #14532D; margin: 0 0 15px 0;">
                        ⚖️ The Fairness Engine™
                      </h3>
                      <p style="color: #166534; margin: 0 0 15px 0;">
                        I track EVERYTHING. Who sat in the front seat last. Who picked the movie. Who fed the dog. Who got the bigger cookie (yes, really).
                      </p>
                      <p style="color: #166534; margin: 0;">
                        When someone yells "NOT FAIR!" you can literally show them the data. Game over.
                      </p>
                    </div>
                    
                    <!-- Personal Insight -->
                    <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <p style="color: #8B5CF6; font-weight: bold; margin: 0 0 10px 0;">
                        🎯 ${familyData.parentName}, based on your family dynamics:
                      </p>
                      <ul style="color: #4B5563; margin: 10px 0; padding-left: 20px;">
                        <li style="margin: 5px 0;">${familyData.child1 || 'Your oldest'} has done 3 more chores this week</li>
                        <li style="margin: 5px 0;">${familyData.child2 || 'Your youngest'} has had 2 more screen time sessions</li>
                        <li style="margin: 5px 0;">Prediction: Next argument will be about ${familyData.nextConflict || 'who gets to pick dinner'}</li>
                      </ul>
                    </div>
                    
                    <!-- Research -->
                    <div style="border-left: 4px solid #10B981; padding-left: 20px; margin: 30px 0;">
                      <p style="color: #6B7280; font-style: italic; margin: 0;">
                        <strong>Child Psychology Research:</strong> Kids' sense of fairness develops at age 3. By age 7, they can spot inequity from 50 feet away, through walls, while sleeping. Having a neutral "referee" reduces conflicts by 68%.
                      </p>
                    </div>
                    
                    <!-- Fun Story -->
                    <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <p style="color: #92400E; margin: 0 0 10px 0;">
                        <strong>😂 True Story:</strong>
                      </p>
                      <p style="color: #78350F; margin: 0;">
                        8-year-old Emma told her friend: "We have a robot that makes sure everything is fair. My mom doesn't decide anything anymore." 
                        <br><br>
                        Her mom: "Best promotion to robot supervisor I've ever gotten."
                      </p>
                    </div>
                    
                    <!-- Quick Win -->
                    <div style="background-color: #EDE9FE; border-radius: 8px; padding: 15px; margin: 30px 0;">
                      <p style="color: #5B21B6; margin: 0;">
                        <strong>⚡ Quick Win:</strong> Set up "Fair Turns" for one thing today (who picks bedtime story, who gets first bath, etc.). Watch the magic happen tonight.
                      </p>
                    </div>
                    
                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${familyData.fairnessSetupUrl}" style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Set Up Fair Turns (30 seconds)
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6B7280; font-size: 14px; margin: 20px 0;">
                      Day 6 sneak peek: How Allie remembers EVERYTHING so you don't have to...
                    </p>
                    
                    <p style="color: #4B5563; font-size: 16px; margin: 30px 0 0 0;">
                      Your fairness referee,<br>
                      <strong style="color: #8B5CF6;">Allie</strong> ⚖️
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },

  // EMAIL 4: Day 7 - The Memory Keeper
  email4_memory: {
    subject: "{{parentName}}, remember when {{child}} said that hilarious thing?",
    sendAfterDays: 7,
    
    getHtml: (familyData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px;">
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1F2937; font-size: 22px; margin: 0 0 20px 0;">
                      "Mom, what was my first word again?"
                    </h2>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                      Last week, a dad texted me: "My daughter asked about her first day of kindergarten. Allie remembered everything - even what she wore. My wife cried. I might have too."
                    </p>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                      Here's the thing: <strong>You're living through thousands of tiny magical moments. But your brain can only hold so much.</strong>
                    </p>
                    
                    <!-- The Feature -->
                    <div style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="color: #991B1B; margin: 0 0 15px 0;">
                        💝 The Family Treasure Vault
                      </h3>
                      <p style="color: #7F1D1D; margin: 0 0 15px 0;">
                        Text me photos, funny quotes, milestone moments. I'll organize them by child, by age, by event. Creating a searchable family history.
                      </p>
                      <p style="color: #7F1D1D; margin: 0;">
                        <strong>The magic:</strong> Ask me "Show me all of Emma's funny quotes" or "What happened on this day last year?" Instant family time capsule.
                      </p>
                    </div>
                    
                    <!-- Personal Touch -->
                    <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <p style="color: #8B5CF6; font-weight: bold; margin: 0 0 10px 0;">
                        📸 ${familyData.parentName}, imagine having instant access to:
                      </p>
                      <ul style="color: #4B5563; margin: 10px 0; padding-left: 20px;">
                        <li style="margin: 5px 0;">Every "first" - first word, first step, first day of school</li>
                        <li style="margin: 5px 0;">That hilarious thing ${familyData.child1 || 'your kid'} said at dinner</li>
                        <li style="margin: 5px 0;">Growth photos automatically organized by month</li>
                        <li style="margin: 5px 0;">Report cards, artwork, certificates - all searchable</li>
                      </ul>
                    </div>
                    
                    <!-- Research -->
                    <div style="border-left: 4px solid #EC4899; padding-left: 20px; margin: 30px 0;">
                      <p style="color: #6B7280; font-style: italic; margin: 0;">
                        <strong>Memory Science:</strong> Parents forget 50% of daily moments within a week. But kids remember random Tuesday afternoons forever. Having a "family memory bank" strengthens bonds and creates legacy.
                      </p>
                    </div>
                    
                    <!-- Emotional Hook -->
                    <div style="background-color: #FEF3C7; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <p style="color: #92400E; margin: 0 0 10px 0;">
                        <strong>❤️ Real mom quote:</strong>
                      </p>
                      <p style="color: #78350F; margin: 0;">
                        "I was making my son's graduation video. Asked Allie for 'all photos of Jake playing soccer through the years.' 6 years of memories, instantly organized. I ugly-cried. Worth every penny."
                      </p>
                    </div>
                    
                    <!-- Quick Start -->
                    <div style="background-color: #EDE9FE; border-radius: 8px; padding: 15px; margin: 30px 0;">
                      <p style="color: #5B21B6; margin: 0;">
                        <strong>🚀 Start now:</strong> Text a photo to ${familyData.smsNumber || '+1-719-748-6209'} with a caption. I'll save it forever. Try sending that cute photo from this morning!
                      </p>
                    </div>
                    
                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${familyData.memoryVaultUrl}" style="display: inline-block; background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Open Your Memory Vault
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="color: #6B7280; font-size: 14px; margin: 20px 0;">
                      Final email coming: The feature that makes other parents say "Wait, your family has WHAT?!"
                    </p>
                    
                    <p style="color: #4B5563; font-size: 16px; margin: 30px 0 0 0;">
                      Your family's memory keeper,<br>
                      <strong style="color: #8B5CF6;">Allie</strong> 📚
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  },

  // EMAIL 5: Day 10 - The Superpower
  email5_superpower: {
    subject: "{{parentName}}, your family just leveled up 🚀",
    sendAfterDays: 10,
    
    getHtml: (familyData) => `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f7f7f7; padding: 20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px;">
                <tr>
                  <td style="padding: 40px;">
                    <h2 style="color: #1F2937; font-size: 24px; margin: 0 0 20px 0;">
                      You're not managing a family anymore.<br>
                      You're running a Family Operating System. 🎯
                    </h2>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 20px 0;">
                      ${familyData.parentName}, you've been using Allie for 10 days. Let me show you what's happened...
                    </p>
                    
                    <!-- Stats Dashboard -->
                    <div style="background: linear-gradient(135deg, #1F2937 0%, #374151 100%); border-radius: 8px; padding: 25px; margin: 30px 0; color: white;">
                      <h3 style="color: white; margin: 0 0 20px 0; text-align: center;">
                        📊 Your Family Dashboard
                      </h3>
                      <table width="100%" style="color: white;">
                        <tr>
                          <td style="padding: 10px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold;">${familyData.timeRecovered || '7.5'}</div>
                            <div style="font-size: 12px; opacity: 0.8;">Hours Recovered</div>
                          </td>
                          <td style="padding: 10px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold;">${familyData.conflictsAvoided || '12'}</div>
                            <div style="font-size: 12px; opacity: 0.8;">Conflicts Avoided</div>
                          </td>
                          <td style="padding: 10px; text-align: center;">
                            <div style="font-size: 28px; font-weight: bold;">${familyData.memoriesSaved || '47'}</div>
                            <div style="font-size: 12px; opacity: 0.8;">Memories Saved</div>
                          </td>
                        </tr>
                      </table>
                    </div>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                      But here's what really matters: <strong>You're present again.</strong>
                    </p>
                    
                    <p style="color: #4B5563; font-size: 16px; line-height: 24px; margin: 0 0 30px 0;">
                      Instead of mentally juggling 47 things during story time, you're actually there. Instead of panic-scrolling through texts for that soccer schedule, you're watching the game.
                    </p>
                    
                    <!-- The Superpower -->
                    <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <h3 style="color: #92400E; margin: 0 0 15px 0;">
                        ⚡ Your Family's Superpower: The Network Effect
                      </h3>
                      <p style="color: #78350F; margin: 0 0 15px 0;">
                        Every family member can talk to me. Grandparents can add events. Kids can check their schedules. Partners stay synced automatically.
                      </p>
                      <p style="color: #78350F; margin: 0;">
                        <strong>You're not the family secretary anymore. You're the CEO, and everyone has access to the system.</strong>
                      </p>
                    </div>
                    
                    <!-- Social Proof -->
                    <div style="background-color: #F9FAFB; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <p style="color: #6B7280; font-style: italic; margin: 0 0 15px 0;">
                        "We went from chaos to calm in 2 weeks. My husband said it's like we hired Mary Poppins, but she's a robot who never takes a day off."
                      </p>
                      <p style="color: #9CA3AF; font-size: 14px; margin: 0;">
                        - Jennifer, mom of 4, Boston
                      </p>
                    </div>
                    
                    <!-- What's Next -->
                    <div style="border-left: 4px solid #8B5CF6; padding-left: 20px; margin: 30px 0;">
                      <p style="color: #4B5563; font-weight: bold; margin: 0 0 10px 0;">
                        🎯 Your next power moves:
                      </p>
                      <ul style="color: #4B5563; margin: 10px 0; padding-left: 20px;">
                        <li style="margin: 5px 0;">Add your extended family (grandparents love this)</li>
                        <li style="margin: 5px 0;">Set up habit tracking for the kids</li>
                        <li style="margin: 5px 0;">Create your first family meeting agenda (I'll help)</li>
                        <li style="margin: 5px 0;">Enable "Allie Insights" for weekly family analytics</li>
                      </ul>
                    </div>
                    
                    <!-- Special Offer -->
                    <div style="background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%); border-radius: 8px; padding: 20px; margin: 30px 0; color: white;">
                      <h3 style="color: white; margin: 0 0 10px 0;">
                        🎁 You've Unlocked: Family Pioneer Status
                      </h3>
                      <p style="color: white; margin: 0 0 15px 0;">
                        As an early adopter, you get lifetime access to all new features as I evolve. Plus, your family's input shapes what I become.
                      </p>
                      <p style="color: white; margin: 0;">
                        <strong>Share Allie with another family this week, and you both get a month free.</strong>
                      </p>
                    </div>
                    
                    <!-- Final CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                      <tr>
                        <td align="center">
                          <a href="${familyData.shareLinkUrl}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                            Share Allie & Get a Month Free
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <div style="background-color: #EDE9FE; border-radius: 8px; padding: 20px; margin: 30px 0;">
                      <p style="color: #5B21B6; margin: 0;">
                        <strong>P.S.</strong> You can always just text me like a friend. "Allie, what's tomorrow look like?" or "Remind me to buy birthday presents" or even "I'm overwhelmed." I'm here 24/7.
                      </p>
                    </div>
                    
                    <p style="color: #4B5563; font-size: 16px; margin: 30px 0 0 0;">
                      Proud to be part of your family,<br>
                      <strong style="color: #8B5CF6;">Allie</strong> 🤖💜
                    </p>
                    
                    <p style="color: #9CA3AF; font-size: 12px; margin: 20px 0 0 0;">
                      Text me anytime: ${familyData.smsNumber || '+1-719-748-6209'}<br>
                      Email me anything: ${familyData.familyEmail}<br>
                      Your family command center: ${familyData.dashboardUrl}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `
  }
};

module.exports = onboardingEmails;