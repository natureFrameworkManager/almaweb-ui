import "../css/main.css";

import "fullcalendar/skeleton.css";
import "fullcalendar/themes/monarch/palettes/purple.css";
import "fullcalendar/themes/monarch/theme.css";

import "./api/api.ts";

import "./theme.ts";
import { attachViewChanger, attachDatatypeChanger, attachViewModeSwitcher } from "./layout.ts";

import "./state/data.ts";
import "./state/save.ts";

import "./filter/data.ts";
import "./filter/prefill-html.ts";
import "./filter/event-handler.ts";

import { loadModules } from "./list/data.ts";
import "./list/list-html.ts";
import "./list/card-html.ts";

import "./calendar/compute.ts";
import "./calendar/render.ts";

import "./tree/compute.ts";
import "./tree/tree-html.ts";

import "./detail/dialog.ts";

import "./export/ical.ts";
import "./export/print.ts";
import "./export/share.ts";

import { lazyLoader } from "./loader.ts";

// Layout changes
attachViewChanger();
attachDatatypeChanger();
attachViewModeSwitcher();

lazyLoader("#module-list1", loadModules);
loadModules(true);
