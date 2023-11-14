// import { defineStore } from 'pinia'
// import {state} from "@nuxt/devtools/dist/runtime/plugins/view/state";
//
// export const useSearchStore = defineStore('search', {
//     state: () => ({
//        default_search: 'Surveys' as string,
//        layer_choices: [
//                'Surveys',
//                'Addresses',
//                'Maptaxlots'
//        ],
//          search_choices: [
//               'Survey Numbers',
//               'Partition Plats',
//               'Township/Ranges',
//               'Subdivisions',
//               'Prepared For',
//               'Prepared By'
//        ],
//         form: false as boolean,
//         loading: false as boolean,
//     }),
//     getters: {
//         getProperty(state) {
//             return state.default_search as string, state.layer_choices, state.search_choices
//         }
//     },
//     actions: {
//
//     },
// })