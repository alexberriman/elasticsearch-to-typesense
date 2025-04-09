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

const COLLECTION_NAME = "clubs";

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

// missing
// - organisation_account_status
// - organisation_associations_id
// - organisation_associations_name
// - organisation_background_video
// - organisation_created_by
// - organisation_followed_users
// - organisation_parcipated_users
// - organisation_profile_admins
export const transformer = createTransformer({
  autoMapProperties: false,
  typesenseSchema: typedTypesenseSchema,
  elasticSchema: typedElasticSchema,
  defaultScoreField: "quality_score:desc",
  propertyMapping: {
    isFeatured: "is_featured",
    isFeaturedDate: "featured_data",
    optimised_avatar: "avatar",
    organisation_background_image: "banner_image",
    organisation_claim_status: "claim_status",
    organisation_created_on: "created_at",
    organisation_image_url: "banner_image",
    organisation_location: "location",
    organisation_location_slug: "location_slug",
    organisation_name: "name",
    organisation_nic_name: "slug",
    organisation_nickname: "slug",
    organisation_sport_types_id: "sport_types_ids",
    organisation_sport_types_name: "sport_types_values",
    organisation_status: "status",
    organisation_title: "title",
    organisation_types_id: "club_types_ids",
    organisation_types_name: "club_types_values",
    organisation_verification_status: "verification_status",
    organisation_visibility: "visibility",
  },
});

export async function setUp() {
  return createCollection({ name: COLLECTION_NAME, schema: collectionSchema });
}

export async function tearDown() {
  return destroyCollection({ name: COLLECTION_NAME });
}
