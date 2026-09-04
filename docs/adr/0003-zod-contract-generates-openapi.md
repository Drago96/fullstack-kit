# The API contract is Zod, and OpenAPI is generated from it

Nest and its clients (Next, React Native) share types through a Contract package of Zod schemas. Nest validates requests against those schemas and generates the OpenAPI spec from them (nestjs-zod), and the typed client is generated from that spec. Zod is the single source of truth: hand-written Swagger decorators drift from runtime validation, and GraphQL adds a second type system the stack does not need.
