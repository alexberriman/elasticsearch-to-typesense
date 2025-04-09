import typesenseSchema from "./typesense-schema.json";
import elasticSchema from "./elastic-schema.json";
import type {
  CollectionFieldSchema,
  CollectionSchema,
  ExtendedTypesenseSchema,
  FieldType,
} from "../../types";
import { createTransformer, ElasticSchema } from "../../../src/index.js";
import { createCollection } from "../../utils/create-collection.js";
import { destroyCollection } from "../../utils/destroy-collection.js";

const COLLECTION_NAME = "activities";

const typedTypesenseSchema = typesenseSchema as ExtendedTypesenseSchema;

const typedFields: CollectionFieldSchema[] = typedTypesenseSchema.fields.map(
  (field) => ({
    name: field.name,
    type: field.type as FieldType,
  })
);

const collectionSchema: CollectionSchema = {
  name: COLLECTION_NAME,
  fields: typedFields,
  default_sorting_field: typedTypesenseSchema.default_sorting_field,
  token_separators: typedTypesenseSchema.token_separators,
  enable_nested_fields: typedTypesenseSchema.enable_nested_fields,
};

const typedElasticSchema: ElasticSchema = {
  properties:
    elasticSchema.properties !== undefined ? elasticSchema.properties : {},
};

export const transformer = createTransformer({
  autoMapProperties: false,
  typesenseSchema: typedTypesenseSchema,
  elasticSchema: typedElasticSchema,
  defaultScoreField: "quality_score:desc",
  propertyMapping: {
    activity_name: "name",
    activity_title: "name",
    activity_url_key: "slug",
    activity_nic_name: "slug",
    activity_location_slug: "location_slug",
    activity_age_from: "ages_from",
    activity_age_to: "ages_to",
    activity_gender: "gender",
    activity_type_id: "type_id",
    activity_type_name: "type_name",
    activity_type: "type",
    activity_sport_type_id: "sport_type_id",
    activity_sporttype_name: "sport_type_name",
    visibility: "visibility_id",
    activity_status: "status",
    activity_date_from: "from_date_time",
    activity_date_to: "to_date_time",
    activity_min_price: "min_price",
    activity_max_price: "max_price",
    activity_price: "max_price",
    activity_created_on: "createdAt",
    activity_subtitle: "club_name",
    activity_location: "geopoint",
    activity_intention: "intentions",
    activity_difficulties: "difficulties",
    activity_is_personal: "is_personal",
    organisation_id: "club_id",
    organisation_avatar: "club_avatar",
    organisation_visibility: "club_visibility",
    organisation_claim_status: "club_claim_status",
    organisation_status: "club_status",
    organisation_account_status: "club_account_status",
  },
});

export async function setUp() {
  return createCollection({ name: COLLECTION_NAME, schema: collectionSchema });
}

export async function tearDown() {
  return destroyCollection({ name: COLLECTION_NAME });
}
