const { CompositeDisposable } = require('atom')

module.exports = {
	activate () {
		this.subscriptions = new CompositeDisposable()

		require('atom-package-deps').install('minimap-highlight-selected')
	},

	consumeMinimapServiceV1 (minimap) {
		this.minimap = minimap
		this.minimap.registerPlugin('highlight-selected', this)
	},

	consumeHighlightSelectedServiceV2 (highlightSelected) {
		this.highlightSelected = highlightSelected
		if (this.minimap && this.active) { this.init() }
	},

	deactivate () {
		this.deactivatePlugin()
		this.minimapPackage = null
		this.highlightSelectedPackage = null
		this.highlightSelected = null
		this.minimap = null
	},

	isActive () {
		return this.active
	},

	activatePlugin () {
		if (this.active) { return }

		this.subscriptions.add(this.minimap.onDidActivate(this.init.bind(this)))
		this.subscriptions.add(this.minimap.onDidDeactivate(this.dispose.bind(this)))

		this.active = true

		if (this.highlightSelected) {
			this.init()
		}
	},

	init () {
		this.decorations = []
		this.highlightSelected.onDidAddMarkerForEditor(options => this.markerCreated(options))
		this.highlightSelected.onDidAddSelectedMarkerForEditor(options => this.markerCreated(options, true))
		this.highlightSelected.onDidRemoveAllMarkers(() => this.markersDestroyed())
	},

	dispose () {
		if (this.decorations) {
			this.decorations.forEach(decoration => decoration.destroy())
		}
		this.decorations = null
	},

	markerCreated (options, selected) {
		if (!selected) { selected = false }
		const minimap = this.minimap.minimapForEditor(options.editor)
		if (!minimap) { return }
		let className = 'highlight-selected'
		if (selected) { className += ' selected' }

		const decoration = minimap.decorateMarker(options.marker,
			{ type: 'highlight', class: className })
		this.decorations.push(decoration)
	},

	markersDestroyed () {
		if (this.decorations) {
			this.decorations.forEach(decoration => decoration.destroy())
		}
		this.decorations = []
	},

	deactivatePlugin () {
		if (!this.active) { return }

		this.active = false
		this.dispose()
		this.subscriptions.dispose()
	},
}
