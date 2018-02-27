import { isEmpty } from '@ember/utils';
import { oneWay } from '@ember/object/computed';
import Component from '@ember/component';

export default Component.extend({
  tagName: 'li',
  editDesciption: oneWay('task.description'),

  editingStart() { /* noop */ },
  editingEnd() { /* noop */ },

  editable: true,
  isEditing: false,

  classNames: [ 'task' ],
  classNameBindings: [ 'task.isDone:done', 'isEditing:editing', 'task.isError:error', 'task.isNew:pending' ],
  attributeBindings: [ 'draggable' ],
  draggable: 'true',

  doubleClick() {
    if (this.get('editable')) {
      this.send('editTask');
    }
  },

  dragStart(event) {
    event.dataTransfer.setData('text/data', this.get('task.id'));
  },

  actions: {
    editTask() {
      if (!this.get('editable')) {
        return;
      }
      this.set('editDescription', this.get('task.description'));
      this.set('isEditing', true);
      this.editingStart();
    },

    cancelEdit() {
      this.set('editDescription', '');
      this.set('isEditing', false);
      this.editingEnd();
    },

    updateTask() {
      if (!this.get('editable')) {
        return;
      }
      let task = this.get('task');
      let description = this.get('editDescription');
      if (!isEmpty(description)) {
        task.set('description', description);
        task.save();
        this.set('isEditing', false);
      } else {
        task.deleteRecord();
        task.save();
      }
      this.editingEnd();
    }
  }
});
