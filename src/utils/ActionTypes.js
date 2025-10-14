// src/utils/ActionTypes.js
export const ActionTypes = {
    // Provider actions
    ADD_PROVIDER: 'add_provider',
    UPDATE_PROVIDER: 'update_provider',
    DELETE_PROVIDER: 'delete_provider',
    
    // Calendar actions
    ADD_EVENT: 'add_event',
    ADD_APPOINTMENT: 'add_appointment',
    UPDATE_EVENT: 'update_event',
    DELETE_EVENT: 'delete_event',
    
    // Task actions
    ADD_TASK: 'add_task',
    COMPLETE_TASK: 'complete_task',
    REASSIGN_TASK: 'reassign_task',
    
    // Child tracking actions
    TRACK_GROWTH: 'track_growth',
    ADD_MEDICAL_RECORD: 'add_medical_record',
    ADD_MILESTONE: 'add_milestone',
    
    // Document actions
    ADD_DOCUMENT: 'add_document',
    
    // Contact actions
    ADD_CONTACT: 'add_contact',
    UPDATE_CONTACT: 'update_contact',
    DELETE_CONTACT: 'delete_contact',
    QUERY_CONTACTS: 'query_contacts',
    
    // Relationship actions
    SCHEDULE_DATE_NIGHT: 'schedule_date_night',
    
    // Query actions
    QUERY_CALENDAR: 'query_calendar',
    QUERY_TASKS: 'query_tasks',
    QUERY_PROVIDERS: 'query_providers',
    
    // Places actions
    ADD_PLACE: 'add_place',
    UPDATE_PLACE: 'update_place',
    DELETE_PLACE: 'delete_place',
    QUERY_PLACES: 'query_places',
    GET_DIRECTIONS: 'get_directions',
    FIND_NEARBY: 'find_nearby',

    // Gift discovery actions (SANTA)
    DISCOVER_GIFTS: 'discover_gifts',
    GET_GIFT_SUGGESTIONS: 'get_gift_suggestions',
    TRACK_GIFT_PRICE: 'track_gift_price',
    SAVE_GIFT_IDEA: 'save_gift_idea'
  };