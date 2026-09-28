export {
    addInfoIfPresent,
    createActionButton,
    syncEntityContainer,
    type EntityKind,
    type EntityView,
    type InfoSpec,
} from "./entity-view";
export {
    COLLECTION_PAGE_SIZE,
    ensureCollection,
    ensurePaneCollections,
    getCachedEntityView,
    getCachedEntityViews,
    initCollectionScrolling,
    loadMoreForPane,
    registerCollection,
    reloadAllCollections,
    reloadCollection,
    setActiveType,
} from "./collection";
export { courseToView } from "./courses";
export { eventToView } from "./events";
export { examToView } from "./exams";
export { locationToView } from "./locations";
export { moduleToView } from "./modules";
export { initModuleDetail, openModuleDetail } from "./module-detail";
export { staffToView } from "./staff";
