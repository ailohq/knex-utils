#!/usr/bin/env bash
set -euf -o pipefail

function collapse_whitespace() {
    awk '{$1=$1};1'
}

function filter_only_mac() {
    grep -i '[0-9A-F]\{2\}\(:[0-9A-F]\{2\}\)\{5\}'
}

function sum() {
    eval "$(which md5 || which md5sum)"
}

function generate_local_id() {
    ifconfig | filter_only_mac | collapse_whitespace | sum
}

function find_package_root() {
    local path=${PWD}

    while [[ "$path" != / ]]; do
        if [[ -f "$path/package.json" ]]; then
            echo "$path"
            return
        fi

        path="$(realpath "$path"/..)"
    done
    return 1
}

function execute() {
    export DB_HOST DB_NAME DB_USER DB_PASSWORD DB_PORT
    "$@"
}

function launch_container() {
    echo "starting container ${DB_NAME}${DOCKER_SUFFIX}"
    docker run --rm --name "${DB_NAME}${DOCKER_SUFFIX}"     \
                    -e POSTGRES_DB="${DB_NAME}"             \
                    -e POSTGRES_USER="${DB_USER}"           \
                    -e POSTGRES_PASSWORD="${DB_PASSWORD}"   \
                    -p 5432                                 \
                    -d postgres:11
    DB_PORT=$(docker port "${DB_NAME}${DOCKER_SUFFIX}" 5432 | cut -d':' -f2)

    echo "To run the node app/tests with local db, prefix your commands with:"
    echo "DB_HOST=$DB_HOST DB_NAME=$DB_NAME DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD DB_PORT=$DB_PORT node ..."

    echo "To connect to the database using \`psql\`, use:"
    echo "PGHOST=$DB_HOST PGDATABASE=$DB_NAME PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD PGPORT=$DB_PORT psql"

    echo "You can also run it by using tmp/local-db file, like \`tmp/local-db-exec psql\`"
    mkdir -p tmp
    echo "#!/bin/sh" > tmp/local-db-exec
    echo "PGHOST=$DB_HOST PGDATABASE=$DB_NAME PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD PGPORT=$DB_PORT DB_HOST=$DB_HOST DB_NAME=$DB_NAME DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD DB_PORT=$DB_PORT \"\$@\"" >> tmp/local-db-exec
    chmod +x tmp/local-db-exec
}

function stop_container() {
    echo "stopping container ${DB_NAME}${DOCKER_SUFFIX}"
    docker stop "${DB_NAME}${DOCKER_SUFFIX}"
}

function setup_test_container() {
    DOCKER_SUFFIX=".${DOCKER_SUFFIX}$(date "+%s")"
    export DB_DEBUG=true
    launch_container
}

function wait_for_db_up() {
    export RETRIES=5
    until PGHOST=$DB_HOST PGDATABASE=$DB_NAME PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD PGPORT=$DB_PORT psql -c "select 1"  > /dev/null 2>&1 || [ ${RETRIES} -eq 0 ]; do
        echo "Waiting for postgres server, $((RETRIES--)) remaining attempts..."
        sleep 1
    done
}

function parse_args() {
    if [ "$#" -eq 0 ]; then
        set -- help
    fi

    case $1 in
        -x)
            shift
            set -x

            parse_args "$@"
            ;;
        --suffix)
            shift
            if [ "$#" -eq 0 ]; then
                echo "--suffix arg requires a parameter" >&2
                exit 1
            fi

            DOCKER_SUFFIX=".$1"
            shift

            parse_args "$@"
            ;;

        ""|help)
            cat <<EOF
                Usage:
                  launch    - launch docker container
                  container - interact with the running container's docker instance, if it exists
                  exec      - execute script using variables to connect to container
                  stop      - stop docker container (and remove it)

              all other commands are forwarded to docker
EOF
            ;;

        launch)
            launch_container
            shift
            if [ "$#" -gt 0 ]; then
                parse_args "$@"
            fi
            ;;

        exec)
            shift
            execute "$@"
            ;;

        stop)
            stop_container
            ;;

        container)
            shift

            if [ "$#" -eq 0 ]; then
                docker container help
                exit 1
            fi

            docker container "$@" "${DB_NAME}${DOCKER_SUFFIX}"
            ;;

        test)
            shift
            setup_test_container
            trap stop_container EXIT
            wait_for_db_up
            export LOG_LEVEL=${LOG_LEVEL:-"error"}
            execute node_modules/.bin/jest "$@"
            ;;

        test-debug)
            shift
            setup_test_container
            trap stop_container EXIT
            wait_for_db_up
            export LOG_LEVEL=${LOG_LEVEL:-"error"}
            execute node --inspect-brk node_modules/.bin/jest --runInBand --detectOpenHandles "$@"
            ;;

        test-migration)
            shift
            setup_test_container
            trap stop_container EXIT

            execute wait_for_db_up

            execute yarn knex migrate:latest
            execute yarn knex migrate:rollback
            ;;

        *)
            shift
            execute yarn "$@"
            ;;
    esac
}

# ENVIRONMENT
DB_HOST='127.0.0.1'
DB_USER='local'
DB_PASSWORD="$(generate_local_id)"
DB_NAME="$(basename "$(find_package_root)")"
DB_NAME="${DB_NAME:-postgres_local}"

# script variables
DOCKER_SUFFIX=""
DB_PORT=""

parse_args "$@"


