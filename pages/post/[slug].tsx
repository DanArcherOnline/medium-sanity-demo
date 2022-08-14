import { GetStaticProps } from "next";
import { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import PortableText from "react-portable-text";
import Header from "../../components/Header";
import { sanityClient, urlFor } from "../../sanity";
import { Post } from '../../typings';

interface Props {
    post: Post;
}

interface FormInput {
    _id: String;
    name: String;
    email: String;
    comment: String;
}

function Post({ post }: Props) {
    console.log(post)
    const { register, handleSubmit, formState: { errors } } = useForm<FormInput>();
    const [isCommentSubmitted, setIsCommentSubmitted] = useState(false);
    const onSubmit: SubmitHandler<FormInput> = async (data) => {
        fetch("/api/createComment", {
            method: 'POST',
            body: JSON.stringify(data)
        }).then(() => {
            console.log(data);
            setIsCommentSubmitted(true);
        }).catch((e) => {
            console.log(e);
            setIsCommentSubmitted(false);
        });
    }
    return (
        <main>
            <Header />
            <img
                className="w-full h-60 object-cover"
                src={urlFor(post.mainImage).url()}
            />
            <article className="max-w-3xl mx-auto">
                <h1 className="text-3xl mt-10 mb-3">{post.title}</h1>
                <h2 className="text-xl font-light text-gray-500 mb-2">{post.description}</h2>
                <div className="flex space-x-2 items-center">
                    <img
                        className="h-10 w-10 rounded-full"
                        src={urlFor(post.author.image).url()}
                    />
                    <p className="font-extralight text-sm">
                        Blog post by <span className="text-green-600">{post.author.name}</span> - Published at {new Date(post._createdAt).toLocaleString()}
                    </p>
                </div>
                <div className="mt-10">
                    <PortableText
                        dataset={process.env.NEXT_PUBLIC_SANITY_DATASET}
                        projectId={process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}
                        content={post.body}
                        serializers={{
                            h1: (props: any) => (
                                <h1 className="text-2xl font-bold my-5" {...props} />
                            ),
                            h2: (props: any) => (
                                <h2 className="text-xl font-bold my-5" {...props} />
                            ),
                            li: ({ children }: any) => (
                                <li className="ml-4 list-disc">{children}</li>
                            ),
                            link: ({ href, children }: any) => (
                                <a href={href} className="text-blue-500 hover:underline">{children}</a>
                            ),
                        }}
                    />
                </div>
            </article>
            <hr className="max-w-lg my-5 mx-auto border border-yellow-500" />
            {isCommentSubmitted &&
                <div className="flex flex-col p-10 my-10 bg-yellow-500 text-white max-w-2xl mx-auto">
                    <h3 className="text-3xl font-bold">Thank you for commenting!</h3>
                    <p>Once it has been approved, it will appear below.</p>
                </div>
            }
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col p-5 max-w-2xl mx-auto">
                <h3 className="text-sm text-yellow-500">Any thoughts on this article?</h3>
                <h4 className="text-3xl font-bold">Leave a comment below!</h4>
                <hr className="py-3 mt-2" />
                <input
                    {...register("_id")}
                    type="hidden"
                    name="_id"
                    value={post._id}
                />
                <label className="block mb-5">
                    <span className="text-gray-700">Name</span>
                    <input {...register("name", { required: true })} className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 focus:outline-yellow-500" placeholder="Mr. Twinkle Boots" type="text" />
                </label>
                <label className="block mb-5">
                    <span className="text-gray-700">Email</span>
                    <input {...register("email", { required: true })} className="shadow border rounded py-2 px-3 form-input mt-1 block w-full ring-yellow-500 focus:outline-yellow-500" placeholder="twinklebee@gmail.com" type="email" />
                </label>
                <label className="block mb-5">
                    <span className="text-gray-700">Comment</span>
                    <textarea {...register("comment", { required: true })} className="shadow border rounded py-2 px-3 form-textarea mt-1 block w-full ring-yellow-500 focus:outline-yellow-500" placeholder="Type your comment here..." rows={8} />
                </label>

                <div className="flex flex-col">
                    {errors.name && <span className="text-red-500">・The Name field is required</span>}
                    {errors.email && <span className="text-red-500">・The Email field is required</span>}
                    {errors.comment && <span className="text-red-500">・The Comment field is required</span>}
                </div>
                <button className="shadow bg-yellow-500 hover:bg-yellow-400 focus:shadow-outline focus:outline-none text-white font-bold py-2 px-4 rounded cursor-pointer" type="submit" >Submit</button>
            </form>
            <div className="flex flex-col p-10 my-10 max-w-2xl mx-auto shadow shadow-yellow-500 space-y-2">
                <h3 className="text-4xl">Comments</h3>
                <hr />
                {post.comments.map((comment) => (
                    <div key={comment._id}>
                        <p>
                            <span className="text-yellow-500">{comment.name}:</span> {comment.comment}
                        </p>
                    </div>
                ))}
            </div>
        </main>
    )
}

export default Post

export const getStaticPaths = async () => {
    const query = `*[_type == "post"] {
        _id,
        slug {
            current,
        },
    }`;
    const posts = await sanityClient.fetch(query);
    const paths = posts.map((post: Post) => ({
        params: {
            slug: post.slug.current,
        }
    }));
    return {
        paths,
        fallback: 'blocking',
    }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
    const query = `*[_type == "post" && slug.current == $slug][0] {
        _id,
        _createdAt,
        title,
        author -> {
            image,
            name,
        },
        "comments": *[
            _type == "comment" &&
            post._ref == ^._id &&
            approved == true
        ],
        description,
        mainImage,
        slug,
        body,
    }`;
    const post = await sanityClient.fetch(query, {
        slug: params?.slug,
    });
    console.log(post);
    if (!post) {
        return {
            notFound: true,
        }
    }
    return {
        props: {
            post,
        },
        revalidate: 60,
    }
}