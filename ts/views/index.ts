export {
    addInfoIfPresent,
    createActionButton,
    syncEntityContainer,
    type DetailKind,
    type EntityKind,
    type EntityView,
    type InfoSpec,
} from "./entity-view";
export {
    COLLECTION_PAGE_SIZE,
    ensureCollection,
    ensurePaneCollections,
    getActiveType,
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
export { degreeToView } from "./degrees";
export { initDetailDialog, openDetail } from "./detail-dialog";
export { registerDetailSpecs } from "./detail-specs";
export { eventToView } from "./events";
export { examToView } from "./exams";
export { locationToView } from "./locations";
export { moduleToView } from "./modules";
export { staffToView } from "./staff";
