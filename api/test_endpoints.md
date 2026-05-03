Steps to run the API
1. Install deps:
   npm install
2. Create DB schema:
   npm run api:init
3. Start server:
   npm start
Server runs at http://localhost:3000

Common bash helpers (use jq if available; sed fallback)
- With jq:
  TOKEN=$(curl -s ... | jq -r '.token')
  ID=$(curl -s ... | jq -r '.user.id // .user_id // .id')
- Without jq (sed):
  TOKEN=$(curl -s ... | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')
  ID=$(curl -s ... | sed -n 's/.*"id":\s*\([0-9]*\).*/\1/p')

Example end-to-end curl sequence
(Replace $TOKEN, $GROUP_CODE, $TEST_CODE, $SECTION_ID, $ITEM_ID, $STUDENT_TOKEN etc. after extracting them)

1) Create teacher account
curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@example.com","password":"secret123","role":"teacher"}' | jq .

2) Login (teacher) and extract token
RESP=$(curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"teacher@example.com","password":"secret123"}')
TOKEN=$(echo "$RESP" | jq -r '.token')
# fallback:
# TOKEN=$(echo "$RESP" | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

3) Create a group
RESP=$(curl -s -X POST http://localhost:3000/groups \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Engineering 2024"}')
echo "$RESP" | jq .
GROUP_CODE=$(echo "$RESP" | jq -r '.group.code')

4) Create a test (quiz) in the group
RESP=$(curl -s -X POST http://localhost:3000/tests \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Algebra I\",\"group_code\":\"$GROUP_CODE\"}")
echo "$RESP" | jq .
TEST_CODE=$(echo "$RESP" | jq -r '.test.code')

5) Create a section for the test
RESP=$(curl -s -X POST http://localhost:3000/sections \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"name\":\"Basics\",\"test_code\":\"$TEST_CODE\"}")
echo "$RESP" | jq .
SECTION_ID=$(echo "$RESP" | jq -r '.section.id')

6) Create items/questions
# MCQ / short-answer
RESP=$(curl -s -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"question\":\"2+2?\",\"answer\":\"4\",\"type\":\"mcq\",\"pts\":1,\"section_id\":$SECTION_ID}")
echo "$RESP" | jq .
ITEM1_ID=$(echo "$RESP" | jq -r '.item.id')

# select-multiple (store correct answer as JSON array string)
RESP=$(curl -s -X POST http://localhost:3000/items \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "{\"question\":\"Select prime numbers\",\"answer\":\"[\\\"2\\\",\\\"3\\\"]\",\"type\":\"select-multiple\",\"pts\":2,\"section_id\":$SECTION_ID}")
echo "$RESP" | jq .
ITEM2_ID=$(echo "$RESP" | jq -r '.item.id')

7) Create student, login and get token/id
curl -s -X POST http://localhost:3000/auth/register -H "Content-Type: application/json" -d '{"email":"student@example.com","password":"studpass","role":"student"}' | jq .
RESP=$(curl -s -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d '{"email":"student@example.com","password":"studpass"}')
STUDENT_TOKEN=$(echo "$RESP" | jq -r '.token')
STUDENT_ID=$(echo "$RESP" | jq -r '.user.id')

8) Student submits answers (auto-graded where possible)
# responses array: item_id + answer (string or JSON array)
curl -s -X POST http://localhost:3000/answers \
  -H "Content-Type: application/json" -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d "{
    \"user_id\": $STUDENT_ID,
    \"test_code\": \"$TEST_CODE\",
    \"responses\": [
      {\"item_id\": $ITEM1_ID, \"answer\": \"4\"},
      {\"item_id\": $ITEM2_ID, \"answer\": [\"2\",\"3\"]}
    ]
  }" | jq .

# Response includes answer_id:
ANS_ID=$(curl -s -X POST http://localhost:3000/answers \
  -H "Content-Type: application/json" -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d "{
    \"user_id\": $STUDENT_ID,
    \"test_code\": \"$TEST_CODE\",
    \"responses\": [
      {\"item_id\": $ITEM1_ID, \"answer\": \"4\"},
      {\"item_id\": $ITEM2_ID, \"answer\": [\"2\",\"3\"]}
    ]
  }" | jq -r '.answer_id')

9) Get attempt detail (teacher or student)
curl -s -X GET http://localhost:3000/answers/$ANS_ID -H "Authorization: Bearer $TOKEN" | jq .

10) Teacher results aggregation
# aggregated results with filters: student (partial email), group, test, pass threshold
curl -s -X GET "http://localhost:3000/answers/results?group=$GROUP_CODE&pass=60" -H "Authorization: Bearer $TOKEN" | jq .

11) Dashboard
curl -s -X GET http://localhost:3000/dashboard -H "Authorization: Bearer $TOKEN" | jq .

Other useful endpoints
- List tests: GET /tests?name=&group=
  curl -s -X GET "http://localhost:3000/tests?group=$GROUP_CODE" -H "Authorization: Bearer $TOKEN" | jq .
- Group detail (members, quizzes, avg performance): GET /groups/:code/detail
  curl -s -X GET http://localhost:3000/groups/$GROUP_CODE/detail -H "Authorization: Bearer $TOKEN" | jq .
- Templates: CRUD at /templates (teacher/admin)
- Users list: GET /users (teacher/admin)

Notes & tips
- All protected endpoints require Authorization: Bearer <JWT>.
- For select-multiple question correct answer, store JSON array string in the item's answer field (e.g. '["A","C"]').
- If jq is not installed, use the sed-based extraction shown earlier.
- If server port differs, change :3000 accordingly.
