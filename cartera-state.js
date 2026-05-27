// cartera-state.js
// Enterprise Cartera State

class CarteraStateRuntime {

    constructor() {

        this.reset();
    }

    reset() {

        this.state = {

            loading: false,

            saving: false,

            importing: false,

            search: '',

            editId: null,

            policies: [],

            filteredPolicies: []
        };
    }

    get() {

        return structuredClone(
            this.state
        );
    }

    set(partial) {

        this.state = {

            ...this.state,

            ...partial
        };
    }

    setPolicies(policies) {

        this.state.policies =
            policies;

        this.state.filteredPolicies =
            policies;
    }

    setSearch(search) {

        this.state.search =
            search;
    }

    setFilteredPolicies(data) {

        this.state.filteredPolicies =
            data;
    }

    setEditing(id) {

        this.state.editId =
            id;
    }

    clearEditing() {

        this.state.editId =
            null;
    }
}

export const CarteraState =
    new CarteraStateRuntime();

export default CarteraState;