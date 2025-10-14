# Fix loadEvents syntax error and duplicates
s/if (checkCalendarEventGuard('loadEvents', { source: 'NewEventContext' })) {.*}, { source: 'NewEventContext' })) {.*}, { source: 'NewEventContext' })) {/if (checkCalendarEventGuard('loadEvents', { source: 'NewEventContext' })) {/

# Fix duplicate processEmptyCalendarResult calls
s/\/\/ Use enhanced guard to track empty results\n        processEmptyCalendarResult();\n        \/\/ Use enhanced guard to track empty results\n        processEmptyCalendarResult();\n        \/\/ Use enhanced guard to track empty results\n        processEmptyCalendarResult();/\/\/ Use enhanced guard to track empty results\n        processEmptyCalendarResult();/

# Fix duplicate clearEmptyResultCounter calls
s/clearEmptyResultCounter();\n        clearEmptyResultCounter();\n        clearEmptyResultCounter();/clearEmptyResultCounter();/

# Fix refreshEvents duplicates
s/if (checkCalendarEventGuard('refreshEvents', { source: 'NewEventContext' })) {.*if (checkCalendarEventGuard('refreshEvents', { source: 'NewEventContext' })) {.*if (checkCalendarEventGuard('refreshEvents', { source: 'NewEventContext' })) {/if (checkCalendarEventGuard('refreshEvents', { source: 'NewEventContext' })) {/
