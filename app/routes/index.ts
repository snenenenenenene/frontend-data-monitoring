import Route from '@ember/routing/route';
import RouterService from '@ember/routing/router-service';
import Transition from '@ember/routing/transition';
import { service } from '@ember/service';
import type PlausibleService from 'ember-plausible/services/plausible';
import config from 'frontend-data-monitoring/config/environment';
import CurrentSessionService, {
  Role,
} from 'frontend-data-monitoring/services/current-session';
import LoketSessionService from 'frontend-data-monitoring/services/session';

export default class ApplicationRoute extends Route {
  @service declare plausible: PlausibleService;
  @service declare session: LoketSessionService;
  @service declare currentSession: CurrentSessionService;
  @service declare router: RouterService;

  async beforeModel(transition: Transition): Promise<void> {
    this.startAnalytics();
    await this.session.setup();
    await this.currentSession.load();
    this.session.requireAuthentication(transition, 'login');
    if (this.session.isAuthenticated) {
      if (this.currentSession.checkRole(Role.OrgUser)) {
        this.router.transitionTo('home.org');
      } else if (
        this.currentSession.checkRole(Role.SupplierUser) ||
        this.currentSession.checkRole(Role.AbbUser)
      ) {
        this.router.transitionTo('home.overview');
      } else {
        throw new Error(
          'Logged in but not with the correct role. Defaulted to public role and there is no content for this type of role.'
        );
      }
      return;
    }
  }

  startAnalytics(): void {
    const { domain, apiHost } = config.plausible;

    if (!domain.startsWith('{{') && !apiHost.startsWith('{{')) {
      this.plausible.enable({
        domain,
        apiHost,
      });
    }
  }
}
