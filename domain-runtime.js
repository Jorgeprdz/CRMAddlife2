// domain-runtime.js
// Domain Runtime Engine
// Uses CoreEventBus + DomainStore

import {
    CoreEventBus
} from './core-event-bus.js';

import {
    Domains
} from './domain-store.js';

class DomainRuntimeEngine {

    initDomain({

        name,

        initialState = {}
    }) {

        Domains.createDomain(

            name,

            initialState
        );
    }

    emit(
        event,
        payload
    ) {

        CoreEventBus.emit(
            event,
            payload
        );
    }

    on(
        event,
        callback
    ) {

        return CoreEventBus.on(
            event,
            callback
        );
    }

    once(
        event,
        callback
    ) {

        return CoreEventBus.once(
            event,
            callback
        );
    }

    off(
        event,
        callback
    ) {

        CoreEventBus.off(
            event,
            callback
        );
    }

    clearEvents(event) {

        CoreEventBus.clear(
            event
        );
    }

    getState(domain) {

        return Domains.getState(
            domain
        );
    }

    setState(
        domain,
        updater
    ) {

        Domains.setState(
            domain,
            updater
        );
    }

    patchState(
        domain,
        partial
    ) {

        Domains.patchState(
            domain,
            partial
        );
    }

    subscribe(
        domain,
        callback
    ) {

        return Domains.subscribe(
            domain,
            callback
        );
    }

    resetDomain(domain) {

        Domains.reset(
            domain
        );
    }

    destroy() {

        CoreEventBus.destroy();
    }
}

export const DomainRuntime =
    new DomainRuntimeEngine();

export default DomainRuntime;