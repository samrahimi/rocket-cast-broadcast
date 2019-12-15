var contentIndex={}

//The HttpRtcService can work with any storage provider that implements save and load as below
//they can store in localStorage, maybe the file system, localDB, or in an external location
//doesn't matter, as long as save and load function as expected and are able to stick content 
//in and out of persistent storage, somewhere
const LocalStorageProvider = {
    save: (uri, resource, mimeType) => {
        try {
            localStorage.setItem(uri, JSON.stringify({
                item: resource,
                originalUrl: uri,
                contentType: mimeType
            }))
        } catch {
            console.log("Error saving content '"+uri+"', make sure it is serializable and not too large")
            return false
        }
        return true;
    },
    load: (uri) => {
        try {
            return localStorage.getItem(uri)
        } catch {
            return null //should never happen, if item is missing, localStorage.getItem returns null
        }
    }
}
const HttpRtcService = {
    initialized: false,
    availableContent: [],
    storageProvider: null,
    dispatcher: null,

    init: (storageProvider, canonicalUrl) => {
        if (HttpRtcService.initialized)
            return false; //already initialized

        //attach the storage provider
        this.storageProvider = storageProvider

        //load the index of content already saved in storage (keyed by their original URL)
        //if a URL is in this list, it means we have the file it points to, 
        //and the application server also knows we have it, so may will signal us
        //when a client requests that URL, if we are connected and it's our turn

        let contentIndex = storageProvider.load('')

    }
}