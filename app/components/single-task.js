import { isEmpty } from '@ember/utils';
import { computed } from '@ember/object';
import { oneWay } from '@ember/object/computed';
import Component from '@ember/component';

export default Component.extend({
  tagName: 'li',
  editDesciption: oneWay('task.description'),

  editingStart() { /* noop */ },

  editable: computed('task.{isError,isNew}', function() {
    return !this.get('task.isNew') || this.get('task.isError');
  }),
  isEditing: false,

  classNames: [ 'task' ],
  classNameBindings: [ 'task.isDone:done', 'isEditing:editing', 'task.isError:error', 'task.isNew:pending', 'draggable' ],
  attributeBindings: [ 'task.id:data-task-id' ],
  draggable: computed('task.{isDone,isEditing,isError}', function () {
    return !(this.get('task.isDone') || this.get('task.isEditing') || this.get('task.isError'));
  }),

  doubleClick() {
    if (this.get('editable')) {
      this.send('editTask');
    }
  },

  touchEnd(event) {
    let now = Date.now();
    let touch = event.changedTouches[0];

    let lastTouchEndEventInfo = this.get('lastTouchEndEventInfo');
    this.set('lastTouchEndEventInfo', {
      clientX: touch.clientX,
      clientY: touch.clientY,
      when: now
    });
    if (!lastTouchEndEventInfo) {
      return;
    }

    if (now - lastTouchEndEventInfo.when < 500) {
      let xDistance = Math.abs(lastTouchEndEventInfo.clientX - touch.clientX);
      let yDistance = Math.abs(lastTouchEndEventInfo.clientY - touch.clientY);

      if (xDistance < 40 && yDistance < 40) {
        let doubleClickEvent = document.createEvent('MouseEvents');
        doubleClickEvent.initMouseEvent(
          'dblclick',
          true, // click bubbles
          true, // click cancelable
          event.view, // copy view
          2,  // click count
          // copy coordinates
          touch.screenX,
          touch.screenY,
          touch.clientX,
          touch.clientY,
          // copy key modifiers
          event.ctrlKey,
          event.altKey,
          event.shiftKey,
          event.metaKey,
          event.button, // copy button 0: left, 1: middle, 2: right
          event.relatedTarget // copy relatedTarget
        );

        event.target.dispatchEvent(doubleClickEvent);
        event.stopPropagation();
        event.preventDefault();
      }
    }
  },

  // dragStart(event) {
  //   event.dataTransfer.setData('text/data', this.get('task.id'));
  // },

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
