// Định nghĩa các endpoint dùng lại trong toàn project

export const AUTH_ENDPOINTS = {
  REGISTER: "/api/auth/register",
  LOGIN: "/api/auth/login",
};

export const MATERIAL_ENDPOINTS = {
  GET_ALL: "/api/material/all",
  DETAIL: "/api/material", // appending /{id}/detail
  ADD: "/api/material/add",
  UPDATE: "/api/material", // appending /{id}/update
  TOGGLE_ACTIVE: "/api/material", // appending /{id}/toggle-active
};

export const CONCEP_TAG_ENDPOINTS = {
  GET_ALL: "/api/concept-tag/all",
  QUERY: "/api/concept-tag/query",
  ADD: "/api/concept-tag/add",
  UPDATE: "/api/concept-tag", // appending /{id}/update
  DELETE: "/api/concept-tag/delete", // appending /{id} in service
};

export const DESIGN_TEMPLATE_ENDPOINTS = {
  QUERY: "/api/design-template/query",
  // MANAGE_CATALOG đã xóa — không tồn tại trong BE. Dùng QUERY thay thế.
  DETAIL: "/api/design-template", // appending /{id}/detail in service
  ADD: "/api/design-template/add",
  UPDATE: "/api/design-template", // appending /{id}/update in service
  DELETE: "/api/design-template", // appending /{id}/delete in service
};

export const DESIGN_TAG_ENDPOINTS = {
  GET_TAGS: "/api/design-tag", // appending /{id}/tags in service
  SYNC: "/api/design-tag/sync",
  ADD: "/api/design-tag",
  UPDATE: "/api/design-tag", // appending /{id}
  DELETE: "/api/design-tag", // appending /{id}
};

export const DESIGN_VARIANT_ENDPOINTS = {
  SEARCH: "/api/design-variant/query",       // POST — BE: /api/design-variant/query
  DETAIL: "/api/design-variant",              // GET /{id}/detail
  ADD: "/api/design-variant/add",             // POST
  UPDATE: "/api/design-variant",              // PATCH /{id}/update — BE dùng PATCH, có {id} trong path
  DELETE: "/api/design-variant",              // DELETE /{id}/delete
};
