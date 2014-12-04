test:
	@node node_modules/lab/bin/lab
test-cov:
	@node node_modules/lab/bin/lab -t 100 -vLa code
test-cov-html:
	@node node_modules/lab/bin/lab -r html -o coverage.html -vLa code

.PHONY: test test-cov test-cov-html
