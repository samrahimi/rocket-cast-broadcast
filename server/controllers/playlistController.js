// Proxies the AJAX endpoints used by the YouTube player
// to circumvent their CORS restrictions, thereby allowing us to 
// avoid using the YouTube Data API with its quotas

const getListUrl = "https://www.youtube.com/list_ajax?style=json&action_get_list=1&list=PLzCxunOM5WFKZuBXTe8EobD6Dwi4qV-kO"