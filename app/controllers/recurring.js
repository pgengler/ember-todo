import { sort } from '@ember/object/computed';
import Controller from '@ember/controller';

export default Controller.extend({
  sortProperties: [ 'id' ],
  lists: sort('model', 'sortProperties')
});
