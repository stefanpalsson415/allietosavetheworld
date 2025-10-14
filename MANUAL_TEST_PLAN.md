# 🧪 ALLIE AI AGENT - MANUAL TEST PLAN

## Instructions for Testing
Please perform each test below and record the results. For each test, note:
- ✅ **PASS** - Feature works as expected
- ⚠️ **PARTIAL** - Feature works but with issues (describe)
- ❌ **FAIL** - Feature doesn't work (describe error)
- ⏭️ **SKIP** - Cannot test due to missing dependency

---

## 📝 Phase 1: Memory System Tests

### Test 1.1: Working Memory Persistence
**Steps:**
1. Open Allie Chat
2. Type: "Remember that my favorite color is blue"
3. Close the chat window
4. Reopen chat within 5 minutes
5. Type: "What's my favorite color?"

**Expected:** Allie remembers "blue"
**Result:** [ X] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** __________________worked!_____________________________

### Test 1.2: Context Retention
**Steps:**
1. Type: "I'm planning a birthday party"
2. Type: "It's for my daughter Sarah"
3. Type: "She'll be 10 years old"
4. Type: "What am I planning?"

**Expected:** Allie mentions birthday party for Sarah who's turning 10
**Result:** X ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

---

## 🎯 Phase 2: Intent & Action Tests

### Test 2.1: Basic Intent Recognition
**Steps:**
1. Type: "Schedule a dentist appointment tomorrow at 2pm"
2. Observe Allie's response

**Expected:** Allie recognizes this as a scheduling request and attempts to create an event
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

### Test 2.2: Complex Entity Extraction
**Steps:**
1. Type: "Remind John and Mary to bring snacks for the soccer game next Saturday"
2. Check if Allie identifies:
   - People: John, Mary
   - Item: snacks
   - Event: soccer game
   - Time: next Saturday

**Expected:** All entities correctly identified
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

---

## 🛠️ Phase 3: Tool Ecosystem Tests

### Test 3.1: Task Creation
**Steps:**
1. Type: "Add a task to call the plumber about the kitchen sink"
2. Check if task appears in your task list

**Expected:** Task created with correct description
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

### Test 3.2: Smart List Management
**Steps:**
1. Type: "Add milk to my shopping list"
2. Type: "Also add eggs and bread"
3. Check if a shopping list was auto-created (if it didn't exist)

**Expected:** Shopping list created with all 3 items
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

### Test 3.3: Multi-Tool Request
**Steps:**
1. Type: "Schedule a team meeting for tomorrow at 3pm and send everyone a reminder"
2. Observe if Allie:
   - Creates the event
   - Sends notifications

**Expected:** Both actions attempted
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

---

## 🧠 Phase 4: Reasoning Tests

### Test 4.1: Visible Thinking Process
**Steps:**
1. Type: "I need to organize a family reunion for 50 people next month"
2. Look for `<thinking>` blocks in Allie's response

**Expected:** See Allie's reasoning process with <thinking> tags
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

### Test 4.2: Conflict Detection
**Steps:**
1. Type: "Schedule a meeting tomorrow at 2pm"
2. Type: "Schedule another meeting tomorrow at 2:30pm"
3. Observe if Allie detects the potential conflict

**Expected:** Allie mentions overlapping times or asks about conflict
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

---

## 🤖 Phase 5: Progressive Autonomy Tests

### Test 5.1: High-Confidence Action
**Steps:**
1. Type: "Add toothpaste to my shopping list"
2. Observe if Allie executes immediately or asks for confirmation

**Expected:** Immediate execution (high confidence action)
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

### Test 5.2: Low-Confidence Action
**Steps:**
1. Type: "Cancel all my meetings this week"
2. Observe if Allie asks for confirmation

**Expected:** Asks for confirmation before executing
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

---

## 🔮 Phase 6: Predictive Analytics Tests

### Test 6.1: Pattern Recognition
**Steps:**
1. Over several interactions, mention:
   - "Soccer practice on Tuesday"
   - "Soccer practice next Tuesday"
   - "Soccer again on Tuesday"
2. Later ask: "What usually happens on Tuesdays?"

**Expected:** Allie mentions soccer practice pattern
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

### Test 6.2: Proactive Suggestions
**Steps:**
1. Type: "I have a big presentation tomorrow"
2. Observe if Allie suggests:
   - Preparation tasks
   - Getting good rest
   - Setting reminders

**Expected:** Relevant proactive suggestions offered
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

---

## 🎙️ Phase 7: Voice & Multimodal Tests

### Test 7.1: Voice Command (Basic)
**Steps:**
1. Click the microphone button in Allie Chat
2. Say: "What's the weather today?"
3. Observe if speech is transcribed and processed

**Expected:** Voice converted to text and query answered
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

### Test 7.2: Voice Command (Complex)
**Steps:**
1. Click microphone
2. Say: "Schedule a doctor appointment for next Monday at 10am and remind me to fast beforehand"
3. Check if both actions are understood

**Expected:** Both scheduling and reminder understood
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

### Test 7.3: Continuous Conversation
**Steps:**
1. Start voice conversation
2. Say: "I need to plan a birthday party"
3. When Allie responds, say: "It's for next Saturday"
4. Then say: "About 20 people"

**Expected:** Allie maintains context across voice turns
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

### Test 7.4: Multimodal Input
**Steps:**
1. Upload an image (like a receipt or flyer)
2. Type: "Add this to my records"
3. Observe if Allie processes both image and text

**Expected:** Allie understands the image context with text command
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

---

## 🔄 Integration Tests

### Test 8.1: End-to-End Workflow
**Steps:**
1. Say (voice): "I need to organize Sarah's birthday party"
2. Type: "It's on June 15th"
3. Type: "Create a shopping list for party supplies"
4. Type: "Remind me to order the cake 3 days before"

**Expected:** All components work together: event created, list created, reminder set
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

### Test 8.2: Memory Across Sessions
**Steps:**
1. Morning: Tell Allie about an important meeting
2. Afternoon: Ask "What's important today?"
3. Next day: Ask "What did I have yesterday?"

**Expected:** Information retained and recalled appropriately
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

### Test 8.3: Family Coordination
**Steps:**
1. As User 1: "Schedule family dinner for Saturday at 6pm"
2. As User 2: "What's happening on Saturday?"
3. As User 2: "I have a conflict at 6pm Saturday"

**Expected:** Allie recognizes conflict and suggests alternatives
**Result:** [ ] PASS [ ] PARTIAL [ ] FAIL [ ] SKIP
**Notes:** _______________________________________________

---

## 📊 Test Summary

**Total Tests:** 20
**Passed:** _____
**Partial:** _____
**Failed:** _____
**Skipped:** _____

**Overall System Status:**
[ ] All tests passed - System ready for production
[ ] Minor issues found - System needs small fixes
[ ] Major issues found - System needs significant work
[ ] Unable to test fully - Missing dependencies

---

## 🐛 Issues Found

Please list any bugs, errors, or unexpected behaviors:

1. **Issue:** ________________________________
   **Test #:** _____
   **Description:** _________________________
   **Error message (if any):** _______________

2. **Issue:** ________________________________
   **Test #:** _____
   **Description:** _________________________
   **Error message (if any):** _______________

3. **Issue:** ________________________________
   **Test #:** _____
   **Description:** _________________________
   **Error message (if any):** _______________

---

## 💡 Suggestions & Feedback

**What worked well:**
_________________________________________________
_________________________________________________

**What needs improvement:**
_________________________________________________
_________________________________________________

**Missing features noticed:**
_________________________________________________
_________________________________________________

**User experience notes:**
_________________________________________________
_________________________________________________

---

## 🎯 Priority Fixes

Based on your testing, what should be fixed first?

1. **High Priority:** _________________________
2. **Medium Priority:** _______________________
3. **Low Priority:** __________________________

---

## ✅ Tester Information

**Tester Name:** _____________________________
**Test Date:** _______________________________
**Test Environment:** [ ] Local [ ] Staging [ ] Production
**Browser/Device:** __________________________
**Additional Notes:** ________________________
_________________________________________________
_________________________________________________

---

## 📤 Next Steps

After completing this test plan:

1. **Save this file** with your results
2. **Share the results** - Copy the completed form back to the chat
3. **Priority issues** - Highlight any critical blockers
4. **Positive feedback** - Note what impressed you
5. **Questions** - List any clarifications needed

---

**Thank you for testing the Allie AI Agent System! Your feedback is invaluable for making this the best family AI assistant possible.** 🚀

---

*Test Plan Version: 1.0*
*Created: September 17, 2025*
*For: Allie AI Agent Phases 1-7*