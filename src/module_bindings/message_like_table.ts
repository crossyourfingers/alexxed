/* eslint-disable */
/* tslint:disable */
import {
  TypeBuilder as __TypeBuilder,
  t as __t,
  type AlgebraicTypeType as __AlgebraicTypeType,
  type Infer as __Infer,
} from 'spacetimedb';

export default __t.row({
  message_sent: __t.timestamp(),
  user_identity: __t.identity(),
});
