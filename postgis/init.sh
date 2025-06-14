#!/bin/bash
set -e

# Overwrite pg_hba.conf to only allow SSL connections from the network
cat > ${PGDATA}/pg_hba.conf <<EOF
# TYPE  DATABASE        USER            ADDRESS                 METHOD
# "local" is for Unix domain socket connections for admin/maintenance.
local   all             all                                     peer

# Require SSL for all remote connections.
hostssl all             all             0.0.0.0/0               md5
hostssl all             all             ::/0                    md5
EOF
