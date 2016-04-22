#!/bin/bash
set -e

if [ -n "$NSQLOOKUPD_PORT_4161_TCP_ADDR" ] && [ -n "$NSQLOOKUPD_PORT_4161_TCP_PORT" ]; then
  export NSQLOOKUPD_ADDRESSES="http://${NSQLOOKUPD_PORT_4161_TCP_ADDR}:${NSQLOOKUPD_PORT_4161_TCP_PORT}"
fi

if [ -z "$NSQLOOKUPD_ADDRESSES" ]; then
    echo "NSQLOOKUPD_ADDRESSES environment variable required"
    exit 1
fi

if [ -z "$MONGODB_CONNECTION" ]; then
    echo "MONGODB_CONNECTION environment variable required"
    exit 1
fi

echo "NSQLOOKUPD: ${NSQLOOKUPD_ADDRESSES}"
echo "MONGODB: ${MONGODB_CONNECTION}"


# execute nodejs application
exec npm start