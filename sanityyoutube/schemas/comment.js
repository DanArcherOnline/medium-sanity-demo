export default {
    name: 'comment',
    title: 'Comment',
    type: 'document',
    fields: [
        {
            name: 'name',
            title: 'Name',
            description: 'Commenters name',
            type: 'string',
        },
        {
            name: 'approved',
            title: 'Approved',
            type: 'boolean',
            description: 'approval to show the comment from a blog admin'
        },
        {
            name: 'email',
            title: 'Email',
            type: 'string',
        },
        {
            name: 'comment',
            title: 'Comment',
            type: 'string',
        },
        {
            name: 'post',
            type: 'reference',
            to: [{ type: "post" }]
        },
    ],
}
