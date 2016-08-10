#!/bin/bash
set -e

if [ -z "$NSQLOOKUPD_ADDRESSES" ]; then
    echo "NSQLOOKUPD_ADDRESSES environment variable required"
    exit 1
fi

if [ -z "$MONGODB_CONNECTION" ]; then
    echo "MONGODB_CONNECTION environment variable required"
    exit 1
fi

if [ -z "$VISION_API_TOKEN" ]; then
    echo "VISION_API_TOKEN environment variable required"
    exit 1
fi

echo "NSQLOOKUPD: ${NSQLOOKUPD_ADDRESSES}"
echo "MONGODB: ${MONGODB_CONNECTION}"


# execute nodejs application
exec npm start