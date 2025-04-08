#!/bin/bash

# 🔧 Config
TYPESENSE_HOST="http://localhost:8108"
TYPESENSE_API_KEY="test123"

COLLECTION_NAME="activities"

# Check if collection exists
echo "🔍 Checking if '$COLLECTION_NAME' collection exists..."
RESPONSE=$(curl -s -H "X-TYPESENSE-API-KEY: $TYPESENSE_API_KEY" "$TYPESENSE_HOST/collections/$COLLECTION_NAME")

if echo "$RESPONSE" | jq -e .name >/dev/null 2>&1; then
  echo "✅ '$COLLECTION_NAME' collection already exists. Skipping creation."
  exit 0
fi

echo "📦 Creating '$COLLECTION_NAME' collection..."

curl -s -X POST "$TYPESENSE_HOST/collections" \
  -H "Content-Type: application/json" \
  -H "X-TYPESENSE-API-KEY: $TYPESENSE_API_KEY" \
  -d @- <<EOF
{
  "name": "$COLLECTION_NAME",
  "fields": [
    { "name": "id", "type": "string" },
    { "name": "name", "type": "string", "index": true, "infix": true, "stem": true },
    { "name": "slug", "type": "string", "index": true },
    { "name": "description", "type": "string", "optional": true, "index": true, "stem": true },
    { "name": "location", "type": "string", "optional": true, "index": true, "infix": true, "stem": true },
    { "name": "suburb", "type": "string", "facet": true, "optional": true },
    { "name": "city", "type": "string", "facet": true, "optional": true },
    { "name": "state", "type": "string", "facet": true, "optional": true },
    { "name": "country", "type": "string", "facet": true, "optional": true },
    { "name": "location_slug", "type": "string", "optional": true },
    { "name": "latitude", "type": "float", "optional": true },
    { "name": "longitude", "type": "float", "optional": true },
    { "name": "geopoint", "type": "geopoint", "optional": true },
    { "name": "ages_from", "type": "int32", "facet": true, "optional": true },
    { "name": "ages_to", "type": "int32", "facet": true, "optional": true },
    { "name": "gender", "type": "string", "facet": true, "optional": true },
    { "name": "type_id", "type": "string", "facet": true, "optional": true },
    { "name": "type_name", "type": "string", "facet": true, "optional": true },
    { "name": "sport_type_id", "type": "string", "facet": true, "optional": true },
    { "name": "sport_type_name", "type": "string", "facet": true, "optional": true },
    { "name": "facility_id", "type": "string", "facet": true, "optional": true },
    { "name": "is_verified", "type": "bool", "facet": true, "optional": true },
    { "name": "visibility_id", "type": "string", "facet": true, "optional": true },
    { "name": "status", "type": "string", "facet": true, "optional": true },
    { "name": "total_capacity", "type": "int32", "optional": true },
    { "name": "total_registrations", "type": "int32", "default": 0 },
    { "name": "total_revenue", "type": "int32", "default": 0 },
    { "name": "club_quality_score", "type": "int32", "default": 0, "facet": true },
    { "name": "quality_score", "type": "float", "default": 0, "sort": true },
    { "name": "from_date_time", "type": "int64", "optional": true },
    { "name": "to_date_time", "type": "int64", "optional": true },
    { "name": "registration_open_date", "type": "int64", "optional": true },
    { "name": "registration_close_date", "type": "int64", "optional": true },
    { "name": "min_price", "type": "float", "facet": true, "optional": true },
    { "name": "max_price", "type": "float", "facet": true, "optional": true },
    { "name": "createdAt", "type": "int64" },
    { "name": "updatedAt", "type": "int64", "optional": true },
    { "name": "club_id", "type": "string", "facet": true },
    { "name": "club_name", "type": "string", "facet": true },
    { "name": "club_verified", "type": "bool", "facet": true },
    { "name": "club_slug", "type": "string" },
    { "name": "club_avatar", "type": "string", "optional": true },
    { "name": "club_background", "type": "string", "optional": true }
  ],
  "default_sorting_field": "createdAt",
  "token_separators": ["-", "_", " "],
  "enable_nested_fields": true
}
EOF

echo "✅ '$COLLECTION_NAME' collection created successfully."
