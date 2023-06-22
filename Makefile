PR_FIXTURE_EXPECTED_FILES := $(addsuffix /expected.json,$(wildcard test/fixture/pr/*/*/*))

CI_VERIFY_GENERATED_FILES := true
GENERATED_FILES += dist/main.js
JS_TSC_TYPECHECK_SKIP_LIB := true

-include .makefiles/Makefile
-include .makefiles/pkg/js/v1/Makefile
-include .makefiles/pkg/js/v1/with-npm.mk
-include .makefiles/pkg/js/v1/with-tsc.mk

.makefiles/%:
	@curl -sfL https://makefiles.dev/v1 | bash /dev/stdin "$@"

################################################################################

.PHONY: precommit
precommit:: verify-generated

.PHONY: generate-fixtures
generate-fixtures: $(PR_FIXTURE_EXPECTED_FILES)

################################################################################

dist/main.js: artifacts/link-dependencies.touch $(JS_SOURCE_FILES)
	node script/build.js dist/main.js

test/src/main.js: artifacts/link-dependencies.touch $(JS_SOURCE_FILES)
	node test/bin/build.js

test/fixture/pr/%/expected.json: artifacts/link-dependencies.touch test/src/main.js test/fixture/pr/%/branch-name test/fixture/pr/%/commit-message test/fixture/pr/%/pr-body
	node test/bin/update-pr-fixture-expected.js "$*"
