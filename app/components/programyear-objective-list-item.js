/* eslint ember/order-in-components: 0 */
import Component from '@ember/component';
import ObjectiListItem from 'ilios/mixins/objective-list-item';

export default Component.extend(ObjectiListItem, {
  programYear: null,
  classNames: ['objective-list-item'],
});
