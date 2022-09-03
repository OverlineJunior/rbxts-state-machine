interface Event {
	[state: string]: string;
}

interface FlowMap {
	[eventName: string]: Event;
}

interface LockLayers {
	[eventName: string]: number;
}

function freshLockLayers(flowMap: FlowMap): LockLayers {
	const lockLayers: LockLayers = {};

	for (const [eventName] of pairs(flowMap)) {
		lockLayers[eventName] = 0;
	}

	return lockLayers;
}

export class StateMachine<Transitions extends FlowMap> {
	readonly state: string;
	readonly trigger?: keyof Transitions;
	private readonly flowMap: Transitions;
	private readonly lockLayers: LockLayers;

	constructor(flowMap: Transitions, state: string, _trigger?: keyof Transitions, _lockLayers?: LockLayers) {
		this.flowMap = flowMap;
		this.state = state;
		this.trigger = _trigger;
		this.lockLayers = _lockLayers !== undefined ? _lockLayers : freshLockLayers(flowMap);
	}

	public transition(eventName: keyof Transitions) {
		const event = this.flowMap[eventName];
		const newState = event[this.state];

		return newState === this.state ? this : new StateMachine(this.flowMap, newState, eventName, this.lockLayers);
	}

	public lock(eventName: string) {
		const newLockLayers = table.clone(this.lockLayers);
		newLockLayers[eventName] += 1;

		return new StateMachine(this.flowMap, this.state, this.trigger, newLockLayers);
	}

	public unlock(eventName: string) {
		if (this.lockLayers[eventName] === 0) return;

		const newLockLayers = table.clone(this.lockLayers);
		newLockLayers[eventName] -= 1;

		return new StateMachine(this.flowMap, this.state, this.trigger, newLockLayers);
	}

	public isLocked(eventName: string) {
		return this.lockLayers[eventName] !== 0;
	}

	public can(eventName: string) {
		const event = this.flowMap[eventName];

		return event[this.state] !== undefined && !this.isLocked(eventName);
	}
}
