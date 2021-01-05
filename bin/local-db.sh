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

function exit_if_docker_disabled() {
    if [[ $USE_LOCAL_POSTGRES == "true" ]]; then
        >&2 echo "On arm64 CPUs (Apple M1 for example) we recommend running a local postgres instead of a docker one."
        >&2 echo "To enforce running tests with docker-based postgres, run the script with LOCAL_DB_USE_LOCAL_POSTGRES=false env var."
        exit 1
    fi
}

function prepare_db() {
    if [[ $USE_LOCAL_POSTGRES == "true" ]]; then
        if ! PGPASSWORD=$DB_PASSWORD psql $DB_NAME $DB_USER -c "SELECT 1" > /dev/null; then
            >&2 echo "Cannot connect to local database.
Make sure you have a local db and user created like the following:
psql postgres -c \"create database $DB_NAME\"
psql postgres -c \"create user $DB_USER with encrypted password '$DB_PASSWORD'\"
psql postgres -c \"grant all privileges on database $DB_NAME to $DB_USER\""
            exit 1
        fi
        return
    fi

    setup_test_container
    wait_for_db_up
}

function launch_container() {
    echo "starting container ${DB_NAME}${DOCKER_SUFFIX}"
    docker run --rm --name "${DB_NAME}${DOCKER_SUFFIX}"     \
                    -e POSTGRES_DB="${DB_NAME}"             \
                    -e POSTGRES_USER="${DB_USER}"           \
                    -e POSTGRES_PASSWORD="${DB_PASSWORD}"   \
                    -p 5432                                 \
                    -d arm64v8/postgres:11
    DB_PORT=$(docker port "${DB_NAME}${DOCKER_SUFFIX}" 5432 | cut -d':' -f2)

    echo -e "\nTo run node app/tests with local db, use following env vars:"
    echo "DB_HOST=$DB_HOST DB_NAME=$DB_NAME DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD DB_PORT=$DB_PORT node ..."

    echo -e "\nTo connect to the database using \`psql\`, use:"
    echo "PGHOST=$DB_HOST PGDATABASE=$DB_NAME PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD PGPORT=$DB_PORT psql"

    LOCAL_DB_ENV_SCRIPT="$(mktemp -d)/local-db-exec"
    echo -e "\nAlternatively, prefix your command in the following manner, to have it run with all of the above vars at once:"
    echo -e "$LOCAL_DB_ENV_SCRIPT ...\n"
    echo "#!/bin/sh" > $LOCAL_DB_ENV_SCRIPT
    echo "PGHOST=$DB_HOST PGDATABASE=$DB_NAME PGUSER=$DB_USER PGPASSWORD=$DB_PASSWORD PGPORT=$DB_PORT DB_HOST=$DB_HOST DB_NAME=$DB_NAME DB_USER=$DB_USER DB_PASSWORD=$DB_PASSWORD DB_PORT=$DB_PORT \"\$@\"" >> $LOCAL_DB_ENV_SCRIPT
    chmod +x $LOCAL_DB_ENV_SCRIPT
}

function stop_container_if_docker_enabled() {
    if [[ $USE_LOCAL_POSTGRES == "true" ]]; then
        return
    fi

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
            exit_if_docker_disabled
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
            exit_if_docker_disabled
            stop_container_if_docker_enabled
            ;;

        container)
            shift
            exit_if_docker_disabled
            if [ "$#" -eq 0 ]; then
                docker container help
                exit 1
            fi
            docker container "$@" "${DB_NAME}${DOCKER_SUFFIX}"
            ;;

        test)
            shift
            trap stop_container_if_docker_enabled EXIT
            prepare_db
            execute node_modules/.bin/jest "$@"
            ;;

        test-debug)
            shift
            trap stop_container_if_docker_enabled EXIT
            execute node --inspect-brk node_modules/.bin/jest --runInBand --detectOpenHandles "$@"
            ;;

        test-migration)
            shift
            trap stop_container_if_docker_enabled EXIT
            execute yarn knex migrate:latest
            execute yarn knex migrate:rollback
            ;;

        *)
            shift
            execute yarn "$@"
            ;;
    esac
}

CPU=$(uname -m)
USE_LOCAL_POSTGRES=${LOCAL_DB_USE_LOCAL_POSTGRES:-$(if [[ $CPU == "arm64" ]]; then echo "true"; fi)}

if [[ $USE_LOCAL_POSTGRES == "true" ]]; then
    SERVICE_NAME=$(cat package.json | jq -r ".name" | sed -e "s/-service//" | sed -e "s/-/_/g")
    DB_USER=ailo_${SERVICE_NAME}_test
    DB_PASSWORD=""
    DB_NAME=$DB_USER
else
    DB_HOST='127.0.0.1'
    DB_USER='local'
    DB_PASSWORD="$(generate_local_id)"
    DB_NAME="$(basename "$(find_package_root)")"
    DB_PORT=""
fi

DOCKER_SUFFIX=""

parse_args "$@"


