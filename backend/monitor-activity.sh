#!/bin/bash
# Continuous monitoring script for video processing pipeline

REGION="us-west-2"
JOB_QUEUE="video-processing-queue"
LOG_FILE="/tmp/video-processing-monitor.log"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "$(date): Starting monitoring..." > $LOG_FILE
echo -e "${BLUE}🔍 Monitoring video processing pipeline...${NC}"
echo -e "${YELLOW}Watching for: uploads, batch jobs, and processing activity${NC}"
echo ""

LAST_JOB_COUNT=0
CHECK_INTERVAL=5

while true; do
    # Check for batch jobs
    SUBMITTED=$(aws batch list-jobs --job-queue $JOB_QUEUE --job-status SUBMITTED --region $REGION --query 'jobSummaryList | length(@)' --output text 2>/dev/null || echo "0")
    PENDING=$(aws batch list-jobs --job-queue $JOB_QUEUE --job-status PENDING --region $REGION --query 'jobSummaryList | length(@)' --output text 2>/dev/null || echo "0")
    RUNNABLE=$(aws batch list-jobs --job-queue $JOB_QUEUE --job-status RUNNABLE --region $REGION --query 'jobSummaryList | length(@)' --output text 2>/dev/null || echo "0")
    STARTING=$(aws batch list-jobs --job-queue $JOB_QUEUE --job-status STARTING --region $REGION --query 'jobSummaryList | length(@)' --output text 2>/dev/null || echo "0")
    RUNNING=$(aws batch list-jobs --job-queue $JOB_QUEUE --job-status RUNNING --region $REGION --query 'jobSummaryList | length(@)' --output text 2>/dev/null || echo "0")

    TOTAL_ACTIVE=$((SUBMITTED + PENDING + RUNNABLE + STARTING + RUNNING))

    # Detect new activity
    if [ $TOTAL_ACTIVE -gt $LAST_JOB_COUNT ]; then
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}🎉 NEW ACTIVITY DETECTED!${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo "$(date): Activity detected - $TOTAL_ACTIVE active jobs" >> $LOG_FILE

        # Show job details
        if [ $SUBMITTED -gt 0 ]; then
            echo -e "${YELLOW}📤 SUBMITTED: $SUBMITTED job(s)${NC}"
        fi
        if [ $PENDING -gt 0 ]; then
            echo -e "${YELLOW}⏳ PENDING: $PENDING job(s)${NC}"
        fi
        if [ $RUNNABLE -gt 0 ]; then
            echo -e "${YELLOW}🔄 RUNNABLE: $RUNNABLE job(s) (waiting for compute resources)${NC}"
        fi
        if [ $STARTING -gt 0 ]; then
            echo -e "${YELLOW}🚀 STARTING: $STARTING job(s) (GPU instance booting)${NC}"
        fi
        if [ $RUNNING -gt 0 ]; then
            echo -e "${GREEN}✨ RUNNING: $RUNNING job(s) (processing video!)${NC}"

            # Get job details
            echo ""
            echo "Active job details:"
            aws batch list-jobs \
                --job-queue $JOB_QUEUE \
                --job-status RUNNING \
                --region $REGION \
                --query 'jobSummaryList[*].[jobName,jobId,createdAt]' \
                --output table
        fi

        echo ""
    fi

    # Status change detection
    if [ $TOTAL_ACTIVE -ne $LAST_JOB_COUNT ]; then
        if [ $TOTAL_ACTIVE -eq 0 ] && [ $LAST_JOB_COUNT -gt 0 ]; then
            echo ""
            echo -e "${GREEN}✅ All jobs completed!${NC}"
            echo "$(date): All jobs completed" >> $LOG_FILE
            echo ""

            # Check for recent completions
            SUCCEEDED=$(aws batch list-jobs --job-queue $JOB_QUEUE --job-status SUCCEEDED --region $REGION --query 'jobSummaryList | length(@)' --output text 2>/dev/null || echo "0")
            FAILED=$(aws batch list-jobs --job-queue $JOB_QUEUE --job-status FAILED --region $REGION --query 'jobSummaryList | length(@)' --output text 2>/dev/null || echo "0")

            if [ $SUCCEEDED -gt 0 ]; then
                echo -e "${GREEN}✓ Recently succeeded: $SUCCEEDED${NC}"
            fi
            if [ $FAILED -gt 0 ]; then
                echo -e "${RED}✗ Recently failed: $FAILED${NC}"
                echo "Recent failures:"
                aws batch list-jobs \
                    --job-queue $JOB_QUEUE \
                    --job-status FAILED \
                    --region $REGION \
                    --query 'jobSummaryList[0:3].[jobName,statusReason]' \
                    --output table
            fi
            echo ""
        fi

        LAST_JOB_COUNT=$TOTAL_ACTIVE
    fi

    # Quiet mode - just show a dot every 30 seconds if no activity
    if [ $(($(date +%s) % 30)) -eq 0 ]; then
        if [ $TOTAL_ACTIVE -eq 0 ]; then
            echo -n "."
        fi
    fi

    sleep $CHECK_INTERVAL
done
