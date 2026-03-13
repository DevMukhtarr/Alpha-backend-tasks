#!/bin/bash
# Quick API Test Script for Candidate Document Intake

# Configuration
BASE_URL="http://localhost:3000"
USER_ID="user-1"
WORKSPACE_ID="workspace-1"

echo "=========================================="
echo "Candidate Document Intake API Tests"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Create a candidate
echo -e "\n${BLUE}Step 1: Creating a candidate...${NC}"
CANDIDATE_RESPONSE=$(curl -s -X POST "$BASE_URL/candidates" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -H "x-workspace-id: $WORKSPACE_ID" \
  -d '{
    "fullName": "Jane Smith",
    "email": "jane.smith@example.com"
  }')

CANDIDATE_ID=$(echo $CANDIDATE_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Candidate created: $CANDIDATE_ID${NC}"
echo "Response: $CANDIDATE_RESPONSE"

# Step 2: Upload first document (Resume)
echo -e "\n${BLUE}Step 2: Uploading Resume...${NC}"
DOC1_RESPONSE=$(curl -s -X POST "$BASE_URL/candidates/$CANDIDATE_ID/documents" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -H "x-workspace-id: $WORKSPACE_ID" \
  -d '{
    "documentType": "resume",
    "fileName": "jane_smith_resume.txt",
    "rawText": "Jane Smith\nSenior Software Engineer\n\nExperience:\n- 8 years as a Full Stack Developer\n- Led team of 5 engineers\n- Expertise in Python, Go, Kubernetes, PostgreSQL\n- Built microservices handling 1M+ requests/day\n\nEducation:\n- BS Computer Science from MIT\n- M.S. Software Engineering from Stanford\n\nSkills:\n- Leadership and mentoring\n- Cloud architecture (AWS, GCP)\n- System design and scalability\n- Team leadership and communication"
  }')

DOC1_ID=$(echo $DOC1_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Resume uploaded: $DOC1_ID${NC}"

# Step 3: Upload second document (Cover Letter)
echo -e "\n${BLUE}Step 3: Uploading Cover Letter...${NC}"
DOC2_RESPONSE=$(curl -s -X POST "$BASE_URL/candidates/$CANDIDATE_ID/documents" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -H "x-workspace-id: $WORKSPACE_ID" \
  -d '{
    "documentType": "cover_letter",
    "fileName": "jane_smith_cover_letter.txt",
    "rawText": "Dear Hiring Manager,\n\nI am Jane Smith, a Senior Software Engineer with 8 years of experience building distributed systems at scale. I am excited about this opportunity to advance my career in a leadership role where I can contribute to building world-class engineering teams.\n\nThroughout my career, I have demonstrated strong technical capabilities combined with exceptional leadership skills. Most recently, I led a team of 5 engineers to redesign our core microservices architecture, resulting in 40% improvement in system latency and 99.99% uptime.\n\nI am passionate about mentoring junior engineers, fostering a culture of code quality, and driving technical excellence. I believe my background aligns perfectly with your team needs.\n\nThank you for considering my application. I look forward to discussing how I can contribute to your organization.\n\nBest regards,\nJane Smith"
  }')

DOC2_ID=$(echo $DOC2_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Cover letter uploaded: $DOC2_ID${NC}"

# Step 4: List documents
echo -e "\n${BLUE}Step 4: Listing all documents...${NC}"
curl -s -X GET "$BASE_URL/candidates/$CANDIDATE_ID/documents" \
  -H "x-user-id: $USER_ID" \
  -H "x-workspace-id: $WORKSPACE_ID" | python3 -m json.tool

# Step 5: Request summary generation
echo -e "\n${BLUE}Step 5: Requesting summary generation...${NC}"
SUMMARY_RESPONSE=$(curl -s -X POST "$BASE_URL/candidates/$CANDIDATE_ID/summaries/generate" \
  -H "Content-Type: application/json" \
  -H "x-user-id: $USER_ID" \
  -H "x-workspace-id: $WORKSPACE_ID" \
  -d '{}')

SUMMARY_ID=$(echo $SUMMARY_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
echo -e "${GREEN}✓ Summary generation requested: $SUMMARY_ID${NC}"
echo "Initial status:"
echo $SUMMARY_RESPONSE | python3 -m json.tool

# Step 6: Wait for processing
echo -e "\n${YELLOW}Waiting 3 seconds for background job processing...${NC}"
sleep 3

# Step 7: Get summary (should now have results)
echo -e "\n${BLUE}Step 6: Retrieving generated summary...${NC}"
FINAL_SUMMARY=$(curl -s -X GET "$BASE_URL/candidates/$CANDIDATE_ID/summaries/$SUMMARY_ID" \
  -H "x-user-id: $USER_ID" \
  -H "x-workspace-id: $WORKSPACE_ID")

echo -e "${GREEN}✓ Summary retrieved:${NC}"
echo $FINAL_SUMMARY | python3 -m json.tool

# Step 8: List all summaries
echo -e "\n${BLUE}Step 7: Listing all summaries...${NC}"
curl -s -X GET "$BASE_URL/candidates/$CANDIDATE_ID/summaries" \
  -H "x-user-id: $USER_ID" \
  -H "x-workspace-id: $WORKSPACE_ID" | python3 -m json.tool

echo -e "\n${YELLOW}========== Test Complete ==========${NC}"
echo -e "${GREEN}All endpoints working successfully!${NC}"
echo -e "\nCandidate ID: ${BLUE}$CANDIDATE_ID${NC}"
echo -e "Summary ID: ${BLUE}$SUMMARY_ID${NC}"
