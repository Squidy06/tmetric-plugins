﻿module Integrations {

    class Userecho implements WebToolIntegration {

        matchUrl = ['*://*.userecho.com/topics/*'];

        render(issueElement: HTMLElement, linkElement: HTMLElement) {

            var host = $$('.topic-actions-panel');

            if (host) {
                var container = $$.create('li');
                container.appendChild(linkElement);
                host.insertBefore(container, host.firstChild);
            }
        }

        getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

            let issueName = $$.try('.topic-header a').textContent;
            if (!issueName) {
                return;
            }

            let issueHref = $$.try('.topic-header a').getAttribute('href');

            //https://company.userecho.com/topics/1-test/
            //https://company.userecho.com/topics/2-test-1-2/
            
            var match = /\/[\w-]+\/([\d])\-.*\//.exec(issueHref);
            if (!match) {
                return;
            }

            var issueId = match[1];
            var serviceUrl = source.protocol + source.host;
            // Work URL https://company.userecho.com/topics/2
            var issueUrl = '/topics/' + issueId;
            var projectName = $$.try('.navbar-brand').textContent;

            return { issueId, issueName, issueUrl, projectName, serviceUrl, serviceType: 'Userecho' };
        }
    }

    IntegrationService.register(new Userecho());
}


