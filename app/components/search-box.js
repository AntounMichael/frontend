import Component from '@ember/component';
import { isPresent } from '@ember/utils';
import { task, timeout } from 'ember-concurrency';

const DEBOUNCE_TIMEOUT = 250;

export default Component.extend({
  classNames: ['search-box'],
  value: '',
  liveSearch: true,
  'data-test-search-box': true,
  searchTask: task(function * () {
    yield timeout(DEBOUNCE_TIMEOUT);
    const value = this.get('value');
    yield this.get('search')(value);
  }).restartable(),
  actions: {
    update(value){
      const liveSearch = this.get('liveSearch');
      this.set('value', value);
      if (liveSearch) {
        this.get('searchTask').perform();
      }
    },
    clear() {
      this.set('value', '');
      const clear = this.get('clear');
      if (isPresent(clear)) {
        clear();
      }
    },
    focus(){
      //place focus into the search box when search icon is clicked
      this.$('input[type="search"]').focus();
    },
  }
});
