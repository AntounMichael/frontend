import Helper from '@ember/component/helper';
import { task } from 'ember-concurrency';
import ReportTitleMixin from 'ilios/mixins/report-title';
import { isNone } from '@ember/utils';

export default Helper.extend(ReportTitleMixin, {

  reportTitle: null,

  compute([report]) {
    const reportTitle = this.get('reportTitle');
    if (! isNone(reportTitle)) {
      return reportTitle;
    }
    this.get('loadTitle').perform(report);
  },

  /**
  * Done as a task so we don't call set on the destroyed Helper
  * if the template is taken out of the DOM while the promise is still resolving
  **/
  loadTitle: task(function * (report) {
    const title = yield this.getReportTitle(report);
    this.set('reportTitle', title);
    this.recompute();
  }).restartable(),
});
