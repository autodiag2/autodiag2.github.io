#!/bin/bash

TOOLS_ROOT="./site/public/tools/"
if ! [ -d "$TOOLS_ROOT" ] ; then
	echo "must be runned as ./adn/install.sh"
	exit 1
fi
DST="$TOOLS_ROOT/adn"
mkdir -p "$DST"
SRC="./adn/adn/"
if ! [ -d "$SRC" ] ; then
	echo "source not found"
	exit 1
fi

cp -rf "$SRC/assets/font" "$DST/assets/"

mkdir -p "$DST/assets/img/"
cp -fr "$SRC/assets/img/prod" "$DST/assets/img/"

cp -rf "$SRC/src" "$DST/"

find "$DST/src" -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.mjs" -o -name "*.ts" -o -name "*.tsx" \) -print0 |
while IFS= read -r -d '' f; do
	sed -i '' \
		-e 's|"/assets|"/tools/adn/assets|g' \
		-e "s|'/assets|'/tools/adn/assets|g" \
		-e 's|"/src|"/tools/adn/src|g' \
		-e "s|'/src|'/tools/adn/src|g" \
		-e 's|"assets|"/tools/adn/assets|g' \
	"$f"
done