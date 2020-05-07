class Clickup implements WebToolIntegration {

    showIssueId = false;

    observeMutations = true;

    matchUrl = '*://app.clickup.com';

    issueElementSelector = [
        '.task',
        '.lv-subtask__outer', // subtask list item
        '.checklist-todo-item' // check list item
    ];

    render(issueElement: HTMLElement, linkElement: HTMLElement) {
        linkElement.classList.add('devart-timer-link-clickup');
        if (issueElement.matches(this.issueElementSelector[0])) {
            let element = $$('.task__toolbar:nth-last-of-type(1)', issueElement);
            if (element) {
                element.insertBefore(linkElement, element.firstElementChild.nextElementSibling);
            }
        } else if (issueElement.matches(this.issueElementSelector[1])) {
            linkElement.classList.add('devart-timer-link-minimal');
            let element = $$('.task-todo-item__name-text', issueElement);
            if (element) {
                element.parentElement.insertBefore(linkElement, element.nextElementSibling);
            }
        } else if (issueElement.matches(this.issueElementSelector[2])) {
            linkElement.classList.add('devart-timer-link-minimal');
            let element = $$('.checklist-item__name-block', issueElement);
            if (element) {
                element.parentElement.insertBefore(linkElement, element.nextElementSibling);
            }
        }
    }

    getIssue(issueElement: HTMLElement, source: Source): WebToolIssue {

        let serviceType = 'ClickUp';

        let serviceUrl = source.protocol + source.host;

        let issueId: string;
        let issueUrl: string;
        let matches = source.fullUrl.match(/\/t\/([^\/]+)$/);
        if (matches) {
            issueId = matches[1];
            issueUrl = '/t/' + issueId;
        }

        let issueName = $$.try('.task-name__overlay').textContent;

        let tags = $$.all('.cu-tags-view__container .cu-tags-view .cu-tags-select__name', issueElement);

        let description: string;
        if (issueElement.matches(this.issueElementSelector[1])) {
            let subtaskLink = <HTMLAnchorElement>$$('.task-todo-item__name-text a', issueElement);
            if (subtaskLink) {
                let matches = subtaskLink.href.match(/\/t\/([^\/]+)$/);
                if (matches) {
                    issueName = subtaskLink.textContent;
                    issueId = matches[1];
                    issueUrl = '/t/' + issueId;
                    tags = $$.all('.cu-tags-view__container-list .cu-tags-view .cu-tags-select__name', issueElement);
                }
            }
        } else if (issueElement.matches(this.issueElementSelector[2])) {
            description = $$.try('.checklist-item__name', issueElement).textContent;
        }

        const spaceName = $$.try('.breadcrumbs__link_first').textContent;

        const folderName = $$.try('.breadcrumbs__link[data-category]').textContent;

        const listName = $$.try('.breadcrumbs__link[data-subcategory]').textContent;


        let projectName = '';
        if(spaceName && folderName && listName){
          projectName = `[${spaceName.trim().replace(`'s Space`, ``)}]-[${folderName.trim()}]-[${listName.trim()}]`;
        } else {
          projectName = `Unknown project`;
        }



        let tagNames = tags.map(_ => _.textContent);

        return { serviceType, serviceUrl, issueId, issueName, issueUrl, description, projectName, tagNames };
    }
}

IntegrationService.register(new Clickup());